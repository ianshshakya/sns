import time
import os
import cv2
from ultralytics import YOLO

# --- Configuration ---
MODEL_PATH = "yolo11n.pt"

# Timing parameters (seconds)
GREEN_LIGHT_DURATION = 10
HIGH_TRAFFIC_THRESHOLD = 5
HIGH_TRAFFIC_DURATION = 20

YELLOW_LIGHT_DURATION = 3
RED_LIGHT_FOR_LOW_TRAFFIC = 15
RED_LIGHT_FOR_HIGH_TRAFFIC = 5

# Directions at the intersection
DIRECTIONS = ["NORTH_SOUTH", "EAST_WEST"]

# --- Function Definitions ---
def load_model(path: str) -> YOLO:
    try:
        model = YOLO(path)
        print("YOLO model loaded successfully.")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def process_intersection(model: YOLO):
    """
    Processes traffic at an intersection using one camera split into two regions:
    - Left half of frame: North-South traffic
    - Right half of frame: East-West traffic
    Only one direction can be green at a time.
    """
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    vehicle_classes = [2, 3, 5, 7]

    print("\n--- Starting synchronized intersection traffic system (split frame). Press 'q' to exit. ---")

    # Initial states
    current_direction = "NORTH_SOUTH"
    current_light_state = "GREEN"
    last_light_change_time = time.time()

    # Timing per direction
    green_duration = {d: GREEN_LIGHT_DURATION for d in DIRECTIONS}
    red_duration = {d: RED_LIGHT_FOR_LOW_TRAFFIC for d in DIRECTIONS}
    traffic_count_frames = {d: [] for d in DIRECTIONS}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame from webcam.")
            break

        height, width, _ = frame.shape
        frame_ns = frame[:, : width // 2]   # Left half for North-South
        frame_ew = frame[:, width // 2 :]   # Right half for East-West

        # Run YOLO detection on both halves
        results_ns = model.predict(frame_ns, verbose=False)
        results_ew = model.predict(frame_ew, verbose=False)

        # Annotate frames
        annotated_ns = results_ns[0].plot()
        annotated_ew = results_ew[0].plot()
        combined = cv2.hconcat([annotated_ns, annotated_ew])
        cv2.imshow("Smart Intersection Traffic System (Split Frame)", combined)

        # Count vehicles in each direction
        count_ns = sum(1 for box in results_ns[0].boxes if int(box.cls[0]) in vehicle_classes)
        count_ew = sum(1 for box in results_ew[0].boxes if int(box.cls[0]) in vehicle_classes)

        if current_direction == "NORTH_SOUTH":
            traffic_count_frames["NORTH_SOUTH"].append(count_ns)
        else:
            traffic_count_frames["EAST_WEST"].append(count_ew)

        elapsed_time = time.time() - last_light_change_time

        if current_light_state == "GREEN" and elapsed_time >= green_duration[current_direction]:
            print(f"[{current_direction}] --- Changing to YELLOW.")
            current_light_state = "YELLOW"
            last_light_change_time = time.time()

        elif current_light_state == "YELLOW" and elapsed_time >= YELLOW_LIGHT_DURATION:
            print(f"[{current_direction}] --- Changing to RED.")
            current_light_state = "RED"
            last_light_change_time = time.time()

            # Recalculate timings based on observed traffic
            avg_count = sum(traffic_count_frames[current_direction]) / max(
                1, len(traffic_count_frames[current_direction])
            )
            if avg_count >= HIGH_TRAFFIC_THRESHOLD:
                green_duration[current_direction] = HIGH_TRAFFIC_DURATION
                red_duration[current_direction] = RED_LIGHT_FOR_HIGH_TRAFFIC
                print(f"[{current_direction}] High traffic. Next Green={green_duration[current_direction]}s, Red={red_duration[current_direction]}s")
            else:
                green_duration[current_direction] = GREEN_LIGHT_DURATION
                red_duration[current_direction] = RED_LIGHT_FOR_LOW_TRAFFIC
                print(f"[{current_direction}] Low traffic. Next Green={green_duration[current_direction]}s, Red={red_duration[current_direction]}s")

            traffic_count_frames[current_direction] = []

            # Switch to the other direction
            current_direction = (
                "EAST_WEST" if current_direction == "NORTH_SOUTH" else "NORTH_SOUTH"
            )
            current_light_state = "GREEN"
            last_light_change_time = time.time()
            print(f"[{current_direction}] --- Changing to GREEN. New cycle started.")

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

def main():
    print("Starting smart synchronized traffic system simulation...")
    model = load_model(MODEL_PATH)
    if not model:
        return
    process_intersection(model)

if __name__ == "__main__":
    main()
