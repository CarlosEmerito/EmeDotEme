# Arquitectura de EmeDotEme

## Visión general

EmeDotEme es un sistema automatizado para la generación y publicación de artículos de noticias sobre criptomonedas, blockchain, tecnología e inteligencia artificial.

## Diagrama de arquitectura

```mermaid
graph TB
    %% Definición de estilos
    classDef frontend fill:#3178c6,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff;
    classDef ai fill:#8b5cf6,stroke:#fff,stroke-width:2px,color:#fff;
    classDef db fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#fff;
    classDef external fill:#64748b,stroke:#fff,stroke-width:2px,color:#fff;

    subgraph "Frontend (Next.js 16 - Vercel)"
        UI[Página Principal]:::frontend
        Admin[Panel Admin]:::frontend
        API[API Routes]:::frontend
    end

    subgraph "Backend Services"
        DB[(PostgreSQL + Prisma)]:::db
        Pipeline{{"Publisher Pipeline"}}:::backend
        RSS[Fuentes RSS]:::external
    end

    subgraph "Intelligence (AI & ML)"
        Gemini[Gemini API]:::ai
        HF[Hugging Face API]:::ai
    end

    subgraph "External Services"
        Supa[Supabase Storage]:::external
        Resend[Resend Email]:::external
        Stock[Unsplash Stock]:::external
        Social[Redes Sociales]:::external
    end

    %% Data Flow
    UI <--> API
    Admin <--> API
    API <--> DB
    
    %% Pipeline Flow
    RSS -- "1. Fetch & Cluster" --> Pipeline
    Pipeline -- "2. Texto/Traducción" --> Gemini
    Pipeline -- "3. QA Imagen" --> Gemini
    Pipeline -- "4. Generar Imagen" --> HF
    HF -- "Fallback" --> Stock
    Pipeline -- "5. Guardar Imagen" --> Supa
    Pipeline -- "6. Guardar Post" --> DB
    Pipeline -- "7. Publicar" --> Social
    API -- "Newsletter" --> Resend
```

## Componentes principales

### Frontend (Next.js)
- **Páginas**: Inicio, artículos, categorías.
- **Panel de administración**: Gestión de contenido.
- **Rutas API**: Endpoints para generación y suscripción.
- **Feeds**: RSS y Atom.

### Base de datos
- PostgreSQL con Prisma ORM.
- Tablas: Articles, Categories, Tags, Subscribers, Settings.

### Pipeline de contenido
- **Servicio de fuentes de noticias**: Fetch y normalización de fuentes RSS (CoinDesk, Decrypt, etc.).
- **Servicio de IA**: Generación bilingüe con Gemini (gemini-2.5-flash), con rotación de hasta 3 claves API.
- **Servicio de imágenes**: Pipeline jerárquico (RSS -> Hugging Face -> Unsplash de stock), con QA vía Gemini Vision.

## Referencias

- [[02 - Stack Tecnológico]]
- [[04 - Flujos de Trabajo]]