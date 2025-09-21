from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from ultralytics import YOLO
import cv2
import time
import uvicorn
import os

# --- Configuration ---
# Use the relative path for the YOLO model
MODEL_PATH = "yolo11n.pt"

# Use absolute paths for reliability (adjust paths to your files)
VIDEO_NS = r"./Assets/east_west.mp4"
VIDEO_EW = r"./Assets/trafficvideo.mp4"

# Timing parameters
GREEN_LIGHT_DURATION = 10
HIGH_TRAFFIC_THRESHOLD = 5
HIGH_TRAFFIC_DURATION = 20
YELLOW_LIGHT_DURATION = 3
RED_LIGHT_FOR_LOW_TRAFFIC = 15
RED_LIGHT_FOR_HIGH_TRAFFIC = 5

# Directions
DIRECTIONS = ["NORTH_SOUTH", "EAST_WEST"]

# Vehicle classes (COCO dataset IDs)
VEHICLE_CLASSES = [2, 3, 5, 7]  # car, motorcycle, bus, truck

# Shared traffic state (for FastAPI /data)
traffic_state = {
    "north_south": 0,
    "east_west": 0,
    "total": 0,
    "current_direction": "NORTH_SOUTH",
    "light_state": "GREEN"
}

# --- FastAPI App Initialization ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load the YOLO model once when the application starts
model = YOLO(MODEL_PATH)
print("✅ YOLO model loaded successfully.")

# --- Functions ---
def update_traffic_state(count_ns: int, count_ew: int, direction: str, light: str):
    """Update global traffic state for API access."""
    global traffic_state
    traffic_state = {
        "north_south": count_ns,
        "east_west": count_ew,
        "total": count_ns + count_ew,
        "current_direction": direction,
        "light_state": light,
    }

def process_intersection():
    """Generator that yields annotated frames with YOLO + synced traffic lights."""

    cap_ns = cv2.VideoCapture(VIDEO_NS)
    cap_ew = cv2.VideoCapture(VIDEO_EW)

    if not cap_ns.isOpened():
        print(f"❌ Error opening video {VIDEO_NS}")
        return
    if not cap_ew.isOpened():
        print(f"❌ Error opening video {VIDEO_EW}")
        return

    current_direction = "NORTH_SOUTH"
    current_light_state = "GREEN"
    last_light_change_time = time.time()

    green_duration = {d: GREEN_LIGHT_DURATION for d in DIRECTIONS}
    red_duration = {d: RED_LIGHT_FOR_LOW_TRAFFIC for d in DIRECTIONS}
    traffic_count_frames = {d: [] for d in DIRECTIONS}

    while True:
        ret_ns, frame_ns = cap_ns.read()
        ret_ew, frame_ew = cap_ew.read()

        # Loop videos when they end
        if not ret_ns:
            cap_ns.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        if not ret_ew:
            cap_ew.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # Run YOLO detection
        results_ns = model.predict(frame_ns, verbose=False)
        results_ew = model.predict(frame_ew, verbose=False)

        annotated_ns = results_ns[0].plot()
        annotated_ew = results_ew[0].plot()

        # Ensure same height before concatenating
        target_height = min(annotated_ns.shape[0], annotated_ew.shape[0])
        annotated_ns = cv2.resize(
            annotated_ns,
            (int(annotated_ns.shape[1] * target_height / annotated_ns.shape[0]), target_height)
        )
        annotated_ew = cv2.resize(
            annotated_ew,
            (int(annotated_ew.shape[1] * target_height / annotated_ew.shape[0]), target_height)
        )

        # Vehicle counts
        count_ns = sum(1 for box in results_ns[0].boxes if int(box.cls) in VEHICLE_CLASSES)
        count_ew = sum(1 for box in results_ew[0].boxes if int(box.cls) in VEHICLE_CLASSES)

        # Update shared state
        update_traffic_state(count_ns, count_ew, current_direction, current_light_state)

        # Draw traffic lights
        def draw_light(frame, state, position=(60, 100)):
            colors = {"RED": (0, 0, 255), "YELLOW": (0, 255, 255), "GREEN": (0, 255, 0)}
            cv2.circle(frame, position, 30, colors[state], -1)
            cv2.putText(frame, state, (position[0] - 40, position[1] + 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, colors[state], 2)

        if current_direction == "NORTH_SOUTH":
            draw_light(annotated_ns, current_light_state)
            draw_light(annotated_ew, "RED")
        else:
            draw_light(annotated_ns, "RED")
            draw_light(annotated_ew, current_light_state)

        combined = cv2.hconcat([annotated_ns, annotated_ew])

        # Light change logic
        elapsed_time = time.time() - last_light_change_time

        if current_light_state == "GREEN" and elapsed_time >= green_duration[current_direction]:
            current_light_state = "YELLOW"
            last_light_change_time = time.time()

        elif current_light_state == "YELLOW" and elapsed_time >= YELLOW_LIGHT_DURATION:
            # Adjust timing based on average traffic
            avg_count = sum(traffic_count_frames[current_direction]) / max(
                1, len(traffic_count_frames[current_direction])
            )
            if avg_count >= HIGH_TRAFFIC_THRESHOLD:
                green_duration[current_direction] = HIGH_TRAFFIC_DURATION
                red_duration[current_direction] = RED_LIGHT_FOR_HIGH_TRAFFIC
            else:
                green_duration[current_direction] = GREEN_LIGHT_DURATION
                red_duration[current_direction] = RED_LIGHT_FOR_LOW_TRAFFIC

            traffic_count_frames[current_direction] = []

            # Switch direction
            current_direction = "EAST_WEST" if current_direction == "NORTH_SOUTH" else "NORTH_SOUTH"
            current_light_state = "GREEN"
            last_light_change_time = time.time()

        # Collect counts
        if current_direction == "NORTH_SOUTH":
            traffic_count_frames["NORTH_SOUTH"].append(count_ns)
        else:
            traffic_count_frames["EAST_WEST"].append(count_ew)

        # Encode frame for streaming
        _, buffer = cv2.imencode(".jpg", combined)
        frame_bytes = buffer.tobytes()
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
        
        # Add a small delay to prevent high CPU usage
        time.sleep(0.01)

# --- FastAPI Routes ---
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the HTML page to display the video feed and data."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Smart Traffic System</title>
        <style>
            body {
                background-color: #f0f2f5;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                padding: 24px;
                text-align: center;
            }
            h1 {
                color: #333;
                font-size: 2em;
                margin-bottom: 16px;
            }
            img {
                border-radius: 8px;
                max-width: 100%;
                height: auto;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .data-container {
                margin-top: 20px;
                font-size: 1.2em;
                text-align: left;
                width: 100%;
                max-width: 600px;
            }
            .data-item {
                margin-bottom: 10px;
            }
            .light-state {
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Smart Traffic System</h1>
            <img src="/video" alt="Traffic Video Feed">
            <div class="data-container">
                <div class="data-item"><strong>North-South Vehicle Count:</strong> <span id="ns-count">0</span></div>
                <div class="data-item"><strong>East-West Vehicle Count:</strong> <span id="ew-count">0</span></div>
                <div class="data-item"><strong>Total Vehicle Count:</strong> <span id="total-count">0</span></div>
                <div class="data-item"><strong>Current Light State:</strong> <span id="light-state" class="light-state">GREEN</span></div>
            </div>
        </div>
        <script>
            async function fetchTrafficData() {
                try {
                    const response = await fetch('/data');
                    const data = await response.json();
                    document.getElementById('ns-count').textContent = data.north_south;
                    document.getElementById('ew-count').textContent = data.east_west;
                    document.getElementById('total-count').textContent = data.total;
                    document.getElementById('light-state').textContent = data.light_state;
                    document.getElementById('light-state').style.color = 
                        data.light_state === 'GREEN' ? 'green' :
                        data.light_state === 'YELLOW' ? 'orange' :
                        'red';
                } catch (error) {
                    console.error("Error fetching traffic data:", error);
                }
            }

            setInterval(fetchTrafficData, 1000);
        </script>
    </body>
    </html>
    """

@app.get("/video")
def video_feed():
    """Video streaming route. Generates a multipart response with video frames."""
    return StreamingResponse(process_intersection(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/data")
def get_traffic_data():
    """Endpoint to get the current traffic state as JSON."""
    return traffic_state

# --- Run the application ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
