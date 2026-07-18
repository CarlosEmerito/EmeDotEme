# Copilot Instructions for EMEDOTEME

## Build, Test, and Lint Commands

- **Install dependencies:**
  - Node.js: `npm install`
  - Python: `pip install -r scripts/python/requirements.txt`
- **Build frontend:** `npm run build`
- **Start dev server:** `npm run dev`
- **Lint:** `npm run lint`
- **Run main pipeline:**
  - Production: `bash publicar.sh` (publishes to social networks)
  - Test: `bash publicarprueba.sh` (dry run, no real publishing)
  - Manual: `npx tsx scripts/publish.ts`
- **Newsletter:** `npx tsx scripts/send_newsletter.ts`
- **Run a single test:**
  - Place tests in `tests/` and run with your preferred Node.js/TypeScript test runner (e.g., `vitest`, `jest`).

## High-Level Architecture

- **Frontend:** Next.js (TypeScript, App Router) in `/app/` for web, admin, and API routes.
- **Backend:**
  - **Database:** PostgreSQL via Prisma ORM (`/prisma/schema.prisma`).
  - **Content pipeline:** Automated article generation and publishing via `scripts/publish.ts`.
  - **AI:** Uses Gemini (Google API) for text, Hugging Face (FLUX.1-schnell) for image generation (`/modules/ai/`).
  - **Images:** Pipeline for QA and fallback (Gemini Vision, Hugging Face, Unsplash stock).
  - **Newsletter:** Weekly generation and sending via Resend API (`/modules/newsletter/`).
  - **Social publishing:** Python scripts in `/scripts/python/` for Bluesky, Telegram, Binance Square.
- **Config:**
  - Environment variables in `.env` (see `.env.example`).
  - Constants and fallback images in `/config/constants.ts`.
- **Logging:**
  - All logs in `logs/emedoteme.log`.
  - Publication history in `logs/historial_publicaciones.csv`.

## Key Conventions

- **Categories:** Use base categories: "Criptomonedas", "Empresa", "IA", "Ciberseguridad".
- **Acronyms:** Crypto/finance acronyms (BTC, ETH, ETF, etc.) must remain uppercase (see `CRYPTO_ACRONYMS` in `config/constants.ts`).
- **Proper nouns:** Normalize names (e.g., 'bitcoin' → 'Bitcoin') using `PROPER_NOUNS` in `config/constants.ts`.
- **Fallback images:** If all image generation fails, use category-based Unsplash images from `FALLBACK_IMAGES`.
- **DRY_RUN:** Set `DRY_RUN=true` in env or script to simulate publishing without real posts.
- **Error handling:** Critical failures abort publishing and notify via Telegram if credentials are set.
- **Module structure:** All business logic is in `/modules/`, separated by domain (articles, ai, images, newsletter, market, news, publisher, storage, notifications).
- **Scripts:** All automation and maintenance scripts are in `/scripts/` (Node.js/TypeScript or Python).
- **Testing:** Place tests in `/tests/` and organize by domain.

## References
- See `/docs/` for detailed architecture, workflows, and configuration.
- See `/modules/README.md` for domain logic structure.
- See `/config/constants.ts` for normalization and fallback logic.
- See `.env.example` for required environment variables.

---

Would you like to configure any MCP servers (e.g., Playwright for E2E testing, or others) for this project?
