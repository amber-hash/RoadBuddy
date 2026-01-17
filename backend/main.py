# main.py
from gemini_mock import get_gemini_response
from eleven_labs_tts import text_to_speech

def main():
    # Step 1: get text from Gemini (mock)
    text = get_gemini_response("Test prompt")

    # Step 2: feed it to Eleven Labs
    text_to_speech(text)

if __name__ == "__main__":
    main()
