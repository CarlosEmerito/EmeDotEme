
# EMEDOTEME – Portal de Noticias y Publicación Unificada

Este proyecto centraliza la generación, publicación y visualización de artículos en redes sociales y web para EMEDOTEME, con enfoque en mantenibilidad, logs y robustez. Ahora incluye noticias de Criptomonedas, Web3, Tecnología y, desde 2026, Inteligencia Artificial (IA).

---

## 🚀 Instalación y requisitos

1. **Clona el proyecto y entra a la carpeta:**
   ```bash
   git clone <repo-url>
   cd emedoteme
   ```
2. **Crea o copia tu archivo `.env`** con todas las claves y configuraciones necesarias (ver `.env.example`).
3. **Instala dependencias Python:**
   ```bash
   pip install -r requirements.txt
   ```
   Y asegúrate de tener Node.js y las dependencias npm:
   ```bash
   npm install
   ```
---

## 🛠️ Variables de entorno clave (`.env`)
- Integra TODO en un solo `.env`, limpio y bien comentado.
- Ejemplos en `.env.example`.
- No compartas ni publiques este archivo con credenciales reales.

---

## 📤 Scripts principales

- **Producción automática (publica en redes):**
  ```bash
  bash publicar.sh
  ```
  > Publicará el artículo generado en Binance Square, Telegram Canal y Bluesky. Todos los logs y errores centralizados en `logs/emedoteme.log`.

- **Prueba segura (no publica en producción, solo test):**
  ```bash
  bash publicarprueba.sh
  ```
  > Simula la publicación (DRY_RUN) y manda la imagen al Telegram privado. Útil para verificar formato, logs y lógica IA. Logs completos en `logs/emedoteme.log`.

- **Historial:**
  - Todas las publicaciones y errores quedan documentadas en `logs/emedoteme.log` y (para auditoría social) en `logs/historial_publicaciones.csv`.

---


## 🧩 Estructura profesional

- `/app/` – Frontend Next.js: páginas, rutas, componentes y API.
- `/modules/` – Lógica de negocio (artículos, IA, imágenes, mercados, newsletter, usuarios).
- `/scripts/` – Scripts de automatización y utilidades (Node.js y Python).
- `/public/` – Archivos estáticos y recursos públicos.
- `/prisma/` – Esquema y migraciones de base de datos.
- `/logs/` – Logs técnicos y de auditoría.
- `/config/` – Configuración global y constantes.
- `/hooks/` – Custom React hooks.
- `/lib/` – Utilidades compartidas y acceso a servicios.
- `/tests/` – Pruebas unitarias y de integración.
---

## 📰 Fuentes de noticias

Las noticias se obtienen automáticamente de fuentes RSS fiables:
- Cripto: CoinDesk, CoinTelegraph, Decrypt, etc.
- IA: VentureBeat AI, MIT Technology Review AI, The AI Report, El País Tecnología, etc.

Las fuentes se configuran en `modules/news/news-sources.service.ts`.

---

---

## 🧑‍💻 Añadir o mantener redes
- Suma nuevos scripts al estilo `/publish_xxx.py`, importando `social_publish_utils.py` y siguiendo los patrones de logging e historial.
- Documenta tus cambios en este README.

---

## 🧪 Pruebas e integración
- Ejecuta flujos completos: `bash publicarprueba.sh` (prueba) y `bash publicar.sh` (real)
- Verifica logs y el historial.
- Si introduces nueva dependencia Python, añade explícitamente a `requirements.txt` y detállalo aquí.

---

## 🔧 Troubleshooting
- Fallos o errores quedan reflejados con timestamp en `logs/emedoteme.log`.
- Asegúrate de tener el `.env` y permisos válidos.
- Consulta el archivo de log antes de escalar/tocar código.

---

## 📚 Licencia
- Consultar condiciones internas EMEDOTEME. Uso restringido, credenciales estrictamente confidenciales.
