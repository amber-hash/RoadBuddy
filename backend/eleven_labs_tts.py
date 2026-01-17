# eleven_labs_tts.py
import requests

API_KEY = "YOUR_ELEVEN_LABS_API_KEY"
VOICE_ID = "YOUR_VOICE_ID"  # Get this from Eleven Labs dashboard
OUTPUT_FILE = "output.mp3"

def text_to_speech(text: str):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        with open(OUTPUT_FILE, "wb") as f:
            f.write(response.content)
        print(f"Saved speech to {OUTPUT_FILE}")
    else:
        print("Error:", response.status_code, response.text)
