# Arquitectura del Proyecto EmeDotEme

## Visión General

EmeDotEme es un sistema automatizado de generación y publicación de artículos de noticias sobre criptomonedas, blockchain, tecnología e inteligencia artificial.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Página   │  │   Admin   │  │    API    │  │  RSS/XML  │  │
│  │  Principal│  │  Panel   │  │  Routes   │  │  Feeds   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │
└────────────────────────────────────────────────────────────────────────────┬───────┘
                                       │                       │
                                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND                                     │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │              DATABASE (PostgreSQL + Prisma)              │           │
│  │  Articles, Categories, Subscribers, Analytics      │           │
│  └────────────────────────────────────────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              CONTENT PIPELINE (scripts/publish.ts)         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            │                                       │
│         ┌──────────────────┼──────────────────┐                │
│         ▼                  ▼                  ▼                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ News       │    │ AI        │    │ Images    │              │
│  │ Sources   │───▶│ Service   │───▶│ Service   │              │
│  │ Service   │    │           │    │           │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│                            │                  │                       │
│         ┌──────────────────┴──┐    ┌──┴───────────┐                │
│         ▼                         ▼              ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ Gemini    │    │ Ollama    │    │ AI Horde  │              │
│  │ (API)    │    │ (Local)  │    │ (API)    │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### Frontend (Next.js)
- **Páginas**: Inicio, artículos, categorías
- **Admin Panel**: Gestión de contenido
- **API Routes**: Endpoints para generación, suscripción
- **Feeds**: RSS y Atom feeds

### Base de Datos
- [[PostgreSQL]] con [[Prisma ORM]]
- Tablas: Articles, Categories, Subscribers, Analytics

### Pipeline de Contenido
- [[News Sources Service]]: Fetch de RSS
- [[AI Service]]: Generación de artículos
- [[Image Service]]: Pipeline de imágenes

## Referencias
- [[Stack Tecnológico]]
- [[Flujo de Publicación Completo]]