# Arquitectura de EmeDotEme

## Visión general

EmeDotEme es un sistema automatizado para la generación y publicación de artículos de noticias sobre criptomonedas, blockchain, tecnología e inteligencia artificial.

## Diagrama de arquitectura

```mermaid
graph TB
    subgraph Frontend [Next.js 16 - Vercel]
        UI[Página Principal]
        Admin[Panel Admin]
        API[API Routes]
    end

    subgraph Backend [Backend Services]
        DB[(PostgreSQL + Prisma)]
        Pipeline[Pipeline de Publicación]
    end

    subgraph Intelligence [AI & ML]
        Gemini[Gemini API]
        Ollama[Ollama Local]
        Horde[AI Horde]
    end

    subgraph Storage [External Services]
        Supa[Supabase Storage]
        Resend[Resend Email]
    end

    UI <--> API
    Admin <--> API
    API <--> DB
    Pipeline <--> DB
    Pipeline --> Gemini
    Pipeline --> Ollama
    Pipeline --> Horde
    Pipeline --> Supa
    API --> Resend
```

## Componentes principales

### Frontend (Next.js)
- **Páginas**: Inicio, artículos, categorías.
- **Panel de administración**: Gestión de contenido.
- **Rutas API**: Endpoints para generación y suscripción.
- **Feeds**: RSS y Atom.

### Base de datos
- PostgreSQL con Prisma ORM.
- Tablas: Articles, Categories, Subscribers, Analytics.

### Pipeline de contenido
- Servicio de fuentes de noticias: Fetch de RSS.
- Servicio de IA: Generación de artículos.
- Servicio de imágenes: Pipeline de imágenes.

## Referencias

- [[02 - Stack Tecnológico]]
- [[04 - Flujos de Trabajo]]