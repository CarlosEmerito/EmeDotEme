import json
import os
import sys
import re
import requests
import tweepy

# Credenciales de Twitter (X) API v2
API_KEY = os.environ.get("TWITTER_API_KEY", "").strip()
API_SECRET = os.environ.get("TWITTER_API_SECRET", "").strip()
ACCESS_TOKEN = os.environ.get("TWITTER_ACCESS_TOKEN", "").strip()
ACCESS_TOKEN_SECRET = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET", "").strip()

OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:14b").strip()
DRY_RUN = os.environ.get("DRY_RUN", "true").lower() in {"1", "true", "yes", "on"}

def limpiar_html(texto):
    return re.sub(r"<[^>]+>", "", texto or "").strip()

def resumir_con_ia(titulo, contenido_sucio):
    try:
        base = limpiar_html(contenido_sucio)
        
        # Un tweet tiene 280 caracteres. El enlace ocupa 23.
        prompt = (
            "Eres el Community Manager de EmeDotEme en Twitter (X).\n"
            "Redacta un tweet MUY VIRAL y DIRECTO AL GRANO sobre esta noticia.\n"
            "Reglas ESTRICTAS:\n"
            "1. MÁXIMO 200 caracteres de longitud. Debes ser muy conciso.\n"
            "2. Usa 1 o 2 emojis relevantes para llamar la atención visual.\n"
            "3. Incluye 2 o 3 hashtags relevantes al final (ej. #Bitcoin, #Crypto).\n"
            "4. NO añadas el enlace (yo lo pondré después).\n"
            "5. NO uses formato Markdown (ni asteriscos, ni comillas).\n"
            "6. Escribe como si fuera un titular de 'Breaking News', ágil y fácil de digerir en el móvil.\n\n"
            f"Titulo: {titulo}\n"
            f"Texto: {base[:1500]}"
        )
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
        r = requests.post("http://localhost:11434/api/generate", json=payload, timeout=60)
        r.raise_for_status()
        
        texto = r.json().get("response", "").strip()
        texto = texto.replace('"', '').replace('**', '').replace('*', '')
        return texto
    except Exception as e:
        print(f"[warn] Ollama fallo generando tweet: {e}")
        return None

def enviar_tweet(texto, link):
    tweet_content = f"{texto}\n\n👉 {link}"
    
    if DRY_RUN:
        print("[dry-run] Simulación de Twitter (X). No se publica realmente.")
        print("\n--- INICIO TWEET ---")
        print(tweet_content)
        print(f"--- FIN TWEET --- (Longitud: {len(tweet_content)} caracteres)\n")
        return True

    if not all([API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET]):
        print("[error] Faltan credenciales de Twitter (X) en el archivo .env. Ignorando publicación.")
        return False

    try:
        client = tweepy.Client(
            consumer_key=API_KEY, 
            consumer_secret=API_SECRET,
            access_token=ACCESS_TOKEN, 
            access_token_secret=ACCESS_TOKEN_SECRET
        )
        # La API v2 gratuita solo permite crear y borrar tweets (nivel Free)
        response = client.create_tweet(text=tweet_content)
        print(f"[ok] Tweet publicado con éxito! ID: {response.data['id']}")
        return True
    except tweepy.errors.TweepyException as e:
        print(f"[error] Tweepy error (API v2): {e}")
        return False
    except Exception as e:
        print(f"[error] Excepción desconocida enviando Tweet: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("[error] Falta el archivo JSON como argumento.")
        sys.exit(1)
    
    json_path = sys.argv[1]
    if not os.path.exists(json_path):
        print(f"[error] No se encontro el archivo: {json_path}")
        sys.exit(1)

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    titulo = data.get("title", "").strip()
    link = data.get("link", "").strip()
    desc = data.get("description", "").strip()

    print(f"[info] Procesando para Twitter (X): {titulo}")
    
    resumen = resumir_con_ia(titulo, desc)
    if not resumen:
        # Fallback genérico en caso de que la IA falle
        resumen = f"🚨 {titulo[:150]}"

    enviar_tweet(resumen, link)

if __name__ == "__main__":
    main()
