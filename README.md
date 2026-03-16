# ADMAN Smart Parking System

This project is part of the Senior Design project developed by **ADMAN Technologies**.  
The system detects available parking spaces using a camera and computer vision.

The goal is to reduce the time drivers spend searching for parking by automatically detecting which spaces are empty.

---

## Key Components

### ROI Labeler
`roi_labeler.py`

This script allows the user to manually label parking spaces from a blank parking lot image.  
The coordinates of each parking space are saved and used later for detection.

Steps:
1. Load an empty parking lot image
2. Click the corners of each parking space
3. Save the coordinates for later processing

---

### Parking Space Detector
`parking_detector_yolo_zoom_v2.py`

This script processes the camera image and determines whether each parking space is:

- Occupied
- Empty

It uses:
- YOLO object detection
- Region-of-interest (ROI) coordinates generated from `roi_labeler.py`

The script analyzes each parking space region and checks for the presence of a vehicle.

---

## System Workflow

1. Capture a blank parking lot image
2. Run `roi_labeler.py` to mark parking spaces
3. Save ROI coordinates
4. Run `parking_detector_yolo_zoom_v2.py`
5. The system determines which spaces are empty

---

## Technologies Used

- Python
- OpenCV
- YOLO Object Detection
- Computer Vision

---

## Project Team

ADMAN Technologies  
Senior Design Project