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

**Oluwakanyinsola David Wole-Adetayo – Team Lead**

Served as the primary team leader and project coordinator. Responsible for organizing meetings, assigning tasks, tracking project milestones, and ensuring the team remained on schedule. Facilitated communication among team members, monitored overall project progress, and helped maintain alignment between technical objectives and project requirements.

**Amairani Solis – Frontend Development and Project Communications Lead**

Served as the primary spokesperson and liaison between the team, faculty mentors, and external stakeholders. Led the design and development of the project's user-facing frontend, creating interfaces that allow users to view parking availability and interact with system data. Assisted with requirements gathering, documentation, presentations, and project planning while ensuring technical concepts and project progress were effectively communicated to both technical and non-technical audiences.

**Aryan Prajapati – Machine Learning and Support Engineer**

Led the development and evaluation of the machine learning components used for parking space occupancy detection. Responsible for dataset preparation, model training, testing, performance analysis, and optimization of detection accuracy. Assisted with software integration efforts between the machine learning subsystem and the broader Smart Parking System while contributing to testing, validation, and overall system development.

**Noah T. McDaniel – Systems Architect and Lead Engineer**

Designed the overall Smart Parking System architecture and served as the primary technical lead for system implementation. Responsible for the design, development, and integration of the project's embedded hardware, networking infrastructure, backend software systems, and data flow architecture. Developed and configured the Raspberry Pi-based sensing and imaging platforms, designed communication pathways between subsystems, implemented backend services and databases, and ensured reliable end-to-end operation from data acquisition through user-facing system outputs. Led technical decision-making regarding system architecture, scalability, networking, and hardware-software integration.

**Matthew Anderson Kelly – Testing and Analysis Engineer**

Supported system evaluation, testing, and performance analysis throughout the project lifecycle. Assisted with identifying design risks, validating system functionality, analyzing test results, and providing recommendations for improvements. Contributed to troubleshooting efforts and helped ensure project requirements were met through systematic verification and testing procedures.

