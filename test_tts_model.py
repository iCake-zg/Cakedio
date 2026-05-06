import requests
import json
import time

def test_tts():
    url = "http://127.0.0.1:8081/tts"
    payload = {
        "text": "各位听众朋友大家好，我是你的专属电台DJ，欢迎收听今天的音乐节目。",
        "language_id": "zh",
        "output_path": "test_output.wav"
    }
    headers = {
        "Content-Type": "application/json"
    }

    print("Sending TTS request...")
    start_time = time.time()
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        
        end_time = time.time()
        print(f"Response Time: {end_time - start_time:.2f} seconds")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Response Body:", response.json())
            print("Test successful. Check test_output.wav in the current directory.")
        else:
            print("Error:", response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    test_tts()