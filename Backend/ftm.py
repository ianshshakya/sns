import cv2
import time
import threading
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from ultralytics import YOLO

app = FastAPI()

# --- Load Model ---
MODEL_PATH = "yolo11n.pt"
model = YOLO(MODEL_PATH)

# --- Video Path ---
VIDEO_PATH = "./Assets/trafficvideo.mp4"
cap = cv2.VideoCapture(VIDEO_PATH)

# Shared data for vehicle counts
traffic_data = {"north_south": 0, "east_west": 0, "total": 0}

vehicle_classes = [2, 3, 5, 7]  # car, motorbike, bus, truck

def process_video():
    global traffic_data, cap
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # loop video
            continue

        height, width, _ = frame.shape
        frame_ns = frame[:, : width // 2]
        frame_ew = frame[:, width // 2 :]

        results_ns = model.predict(frame_ns, verbose=False)
        results_ew = model.predict(frame_ew, verbose=False)

        count_ns = sum(1 for box in results_ns[0].boxes if int(box.cls[0]) in vehicle_classes)
        count_ew = sum(1 for box in results_ew[0].boxes if int(box.cls[0]) in vehicle_classes)

        traffic_data = {
            "north_south": count_ns,
            "east_west": count_ew,
            "total": count_ns + count_ew,
        }

        # Merge annotated frames
        annotated_ns = results_ns[0].plot()
        annotated_ew = results_ew[0].plot()
        combined = cv2.hconcat([annotated_ns, annotated_ew])

        _, buffer = cv2.imencode('.jpg', combined)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# Background thread for video processing
def start_processing():
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    while True:
        pass

# API to stream video
@app.get("/video")
def video_feed():
    return StreamingResponse(process_video(), media_type="multipart/x-mixed-replace; boundary=frame")

# API to fetch traffic data
@app.get("/data")
def get_data():
    return JSONResponse(content=traffic_data)
