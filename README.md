# Parking Spot Backend (FastAPI + SQLite)

This backend stores:
- **Spot inventory** (labels + bounding boxes) in the `spots` table
- **Current status** (empty/occupied/unknown) in the `spot_state` table
- **History** of changes in the `spot_events` table (optional logging)

The “database” is a local SQLite file created automatically.

---

## How to Run the database + API server

**Windows PowerShell**
py -m venv .venv
.\.venv\Scripts\Activate.ps1

## How to Test Functionality

1. go to the link provided after running the server, then add "/docs"
2. You should be able to see all Get and Pull functions. To test a function, expand it and hit "Try it out"
3. Type the header, which is the spot(s) you'd like to change the status of, then edit the JSON response below it.

---

Headers:
U1, U2, L1, L2
JSON Response Fields:
confidence: 0-1.0
status: "occupied:, "empty", "unknown"
