import time
import requests
import RPi.GPIO as GPIO

PIN = 17

CAMERA_TRIGGER_URL = "http://camera-pi:8000/trigger"

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

last_state = GPIO.input(PIN)

print("Gate listener started")
print(f"Initial state: {last_state}")

try:
    while True:
        state = GPIO.input(PIN)

        if state != last_state:
            print(f"Gate state changed: {last_state} -> {state}")

            if state == 0:
                print("Gate opened. Triggering camera Pi.")

                try:
                    response = requests.post(CAMERA_TRIGGER_URL, timeout=5)
                    print(f"Camera Pi response: {response.status_code}")
                    print(response.text)
                except requests.RequestException as e:
                    print(f"Failed to contact camera Pi: {e}")

            last_state = state

        time.sleep(0.1)

except KeyboardInterrupt:
    print("Stopping gate listener")

finally:
    GPIO.cleanup()