This Raspberry Pi Zero 2 W monitors the gate relay using its GPIO17 pin

## Logic
- Gate closed = GPIO reads 1
- Gate opened = GPIO reads 0
- `gate_listener.py` - continuously listens for gate openings

When the gate opens, this Pi sends a POST request to the Camera Pi.

## Install Service

sudo cp gate_listener.service /etc/systemd/system/gate_listener.service
sudo systemctl daemon-reload
sudo systemctl enable gate_listener
sudo systemctl start gate_listener