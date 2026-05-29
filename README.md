# ADMAN SmartPark Project

## Overview

Adman SmartPark is a smart parking management system designed to provide real-time parking space monitoring, gate access control, and occupancy reporting. This branch contains the services responsible for collecting sensor data, processing parking events, managing device communication, and serving data to frontend applications.

The backend acts as the central communication layer between distributed parking lot hardware nodes and the user-facing dashboard, enabling reliable monitoring of parking availability and system status.

---

## Features

* Real-time parking occupancy tracking
* Raspberry Pi sensor node integration
* Gate open/close event monitoring
* REST API endpoints for frontend applications
* Database storage for parking events and occupancy records
* Device health monitoring and status reporting
* Remote management of distributed parking hardware
* Network-based communication between embedded devices and cloud services

---

## System Architecture

### Hardware Layer

* Raspberry Pi Zero 2 with optocoupler monitors the gate relay's status
* Raspberry Pi 4W with IP camera overlooks parking lot and sends pictures to the live server running the backend

### Backend Layer

* API server for data management and processing
* Event processing services
* Database integration
* Device communication services

### Frontend Layer

* Administrative dashboard
* Parking availability display
* Analytics and reporting tools

---

## Data Flow

1. Sensor nodes detect occupancy changes.
2. Raspberry Pi zero 2 transmits event to the 4W Pi.
3. 4W Pi takes a snapshot with the camera and transmits it to the backend server.
4. Backend services validate and process incoming data.
5. Occupancy records are updated in the database.
6. Dashboard applications receive updated parking information.
7. Administrators can monitor lot status in real time.

---

## Technologies

### Programming Languages

* Python
* JavaScript

### Networking

* HTTP/HTTPS APIs
* RESTful services
* TCP/IP networking

### Hardware Platforms

* Raspberry Pi Zero 2 W
* GPIO-based sensor interfaces

### Development Tools

* Git
* GitHub
* Linux
* VS Code
* Tailscale
---

## Educational Value

This project combines concepts from:

* Embedded Systems
* Computer Networking
* Internet of Things (IoT)
* Distributed Systems
* Backend Software Development
* Systems Integration
* Real-Time Data Processing

---

## Contributors

Developed as part of the ADMAN SmartPark project by the University of Memphis Computer Engineering team.
