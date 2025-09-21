import cv2
import time
from ultralytics import YOLO   # ✅ must be imported before usage

# --- Configuration ---
MODEL_PATH = "yolo11n.pt"

# Use absolute paths for reliability (adjust paths to your files)
VIDEO_NS = r"C:\Users\yanur\SNS\Assets\trafficvideo_ns.mp4"
VIDEO_EW = r"C:\Users\yanur\SNS\Assets\trafficvideo_ew.mp4"

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


def load_model(path: str) -> YOLO:
    """Load YOLO model from path."""
    try:
        model = YOLO(path)
        print("✅ YOLO model loaded successfully.")
        return model
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None


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


def process_intersection(model: YOLO, video_ns: str, video_ew: str):
    """Generator that yields annotated frames with YOLO + synced traffic lights."""

    cap_ns = cv2.VideoCapture(video_ns)
    cap_ew = cv2.VideoCapture(video_ew)

    if not cap_ns.isOpened():
        print(f"❌ Error opening video {video_ns}")
        return
    if not cap_ew.isOpened():
        print(f"❌ Error opening video {video_ew}")
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

        # 🔧 Ensure same height before concatenating
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
