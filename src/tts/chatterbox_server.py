from fastapi import FastAPI
from pydantic import BaseModel
import soundfile as sf
from kokoro_onnx import Kokoro
import os
import uvicorn
import threading
import gc

app = FastAPI()

print("Loading Kokoro ONNX model...")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
model_path = os.path.join(MODEL_DIR, "kokoro-v1.0.onnx")
voices_path = os.path.join(MODEL_DIR, "voices-v1.0.bin")

# 确保模型文件存在
if not os.path.exists(model_path) or not os.path.exists(voices_path):
    print("Downloading Kokoro ONNX models...")
    import urllib.request
    os.makedirs(MODEL_DIR, exist_ok=True)
    if not os.path.exists(model_path):
        urllib.request.urlretrieve("https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx", model_path)
    if not os.path.exists(voices_path):
        urllib.request.urlretrieve("https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin", voices_path)

model = Kokoro(model_path, voices_path)
print("Model loaded successfully.")

# 添加全局锁，防止并发推理
generation_lock = threading.Lock()

class TTSRequest(BaseModel):
    text: str
    language_id: str = "zh"
    output_path: str

@app.post("/tts")
def generate_tts(req: TTSRequest):
    # 强制串行处理 TTS 请求
    with generation_lock:
        try:
            # lang 映射，Kokoro ONNX 使用 'cmn' 表示中文
            lang_code = "cmn" if req.language_id == "zh" else req.language_id
            
            # 使用合适的中文声音 zm_yunjian (男声) 或者 zf_xiaobei (女声)
            voice_name = "zm_yunjian" 
            
            samples, sample_rate = model.create(
                req.text, 
                voice=voice_name, 
                speed=1.0, 
                lang=lang_code
            )
            sf.write(req.output_path, samples, sample_rate)
            return {"success": True, "output": req.output_path}
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
        finally:
            gc.collect()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8081)
