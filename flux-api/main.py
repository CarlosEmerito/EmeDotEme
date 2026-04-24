import os
import torch
import io
import base64
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from diffusers import FluxPipeline
from PIL import Image
import uvicorn

app = FastAPI(title="Flux.1 Local API")

# Configuración del modelo
MODEL_ID = os.getenv("MODEL_ID", "black-forest-labs/FLUX.1-dev")
HF_TOKEN = os.getenv("HF_TOKEN")

# Cargamos el pipeline globalmente
print(f"🚀 Cargando modelo {MODEL_ID}...")
try:
    pipe = FluxPipeline.from_pretrained(
        MODEL_ID, 
        torch_dtype=torch.bfloat16,
        token=HF_TOKEN
    )
    
    # enable_model_cpu_offload() es ideal para 8GB. 
    # Si aun así falla, se puede usar pipe.enable_sequential_cpu_offload()
    pipe.enable_sequential_cpu_offload()
    
    # OPTIMIZACIÓN EXTRA PARA EL PASO FINAL (VAE)
    pipe.vae.enable_tiling()
    
    print("✅ Modelo cargado y optimizado con SEQUENTIAL CPU OFFLOAD + VAE Tiling.")
except Exception as e:
    print(f"❌ Error cargando el modelo: {e}")
    pipe = None

class GenerateRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    num_inference_steps: int = 28 # Flux.1 [dev] recomienda ~28, [schnell] ~4
    guidance_scale: float = 3.5

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_ID, "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None"}

@app.post("/generate")
async def generate(request: GenerateRequest):
    if pipe is None:
        raise HTTPException(status_code=500, detail="El modelo no está cargado correctamente.")
    
    try:
        print(f"🎨 Generando: {request.prompt[:50]}...")
        
        # Generar imagen
        image = pipe(
            request.prompt,
            width=request.width,
            height=request.height,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
        ).images[0]
        
        # Convertir a Base64 para facilitar el envío vía JSON
        buffered = io.BytesIO()
        image.save(buffered, format="WEBP", quality=90)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "image_b64": img_str,
            "format": "webp",
            "info": {
                "width": request.width,
                "height": request.height,
                "steps": request.num_inference_steps
            }
        }
    except Exception as e:
        print(f"❌ Error en generación: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
