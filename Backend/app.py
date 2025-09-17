import cv2
import time
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from ultralytics import YOLO

app = FastAPI()

# --- Config ---
MODEL_PATH = "yolo11n.pt"   # path to your YOLO model
VIDEO_PATH = "./Assets/trafficvideo.mp4"

# Load model
model = YOLO(MODEL_PATH)

# Video capture
cap = cv2.VideoCapture(VIDEO_PATH)

# Store traffic data
traffic_data = {"north_south": 0, "east_west": 0, "total": 0}
vehicle_classes = [2, 3, 5, 7]  # car, motorbike, bus, truck


def process_video():
    """Generator that yields YOLO-annotated video frames."""
    global traffic_data, cap
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # restart video when it ends
            continue

        height, width, _ = frame.shape
        frame_ns = frame[:, : width // 2]   # Left = North-South
        frame_ew = frame[:, width // 2 :]   # Right = East-West

        # Run YOLO predictions
        results_ns = model.predict(frame_ns, verbose=False)
        results_ew = model.predict(frame_ew, verbose=False)

        # Count vehicles
        count_ns = sum(1 for box in results_ns[0].boxes if int(box.cls[0]) in vehicle_classes)
        count_ew = sum(1 for box in results_ew[0].boxes if int(box.cls[0]) in vehicle_classes)

        # Update shared data
        traffic_data = {
            "north_south": count_ns,
            "east_west": count_ew,
            "total": count_ns + count_ew,
        }

        # Annotated frames
        annotated_ns = results_ns[0].plot()
        annotated_ew = results_ew[0].plot()
        combined = cv2.hconcat([annotated_ns, annotated_ew])

        # Encode as JPEG
        _, buffer = cv2.imencode('.jpg', combined)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


# --- API Endpoints ---

@app.get("/video")
def video_feed():
    """Stream video with YOLO detections."""
    return StreamingResponse(process_video(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/data")
def get_data():
    """Return latest traffic vehicle counts as JSON."""
    return JSONResponse(content=traffic_data)


# --- Run server ---
# Use: uvicorn app:app --reload
