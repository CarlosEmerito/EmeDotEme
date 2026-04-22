# Scripts EmeDotEme

## Índice de Scripts

| Script | Descripción |
|--------|-------------|
| [[Scripts#publish.ts\|publish.ts]] | Pipeline principal |
| [[Scripts#force-generate.ts\|force-generate.ts]] | Forzar generación |
| [[Scripts#publish_test.ts\|publish_test.ts]] | Modo prueba |
| [[Scripts#send_newsletter.ts\|send_newsletter.ts]] | Newsletter |

---

## publish.ts

**Ubicación**: `scripts/publish.ts`

### Descripción

Pipeline principal de generación y publicación automática de artículos.

### Uso

```bash
# Ejecución directa
npx ts-node scripts/publish.ts

# Con tsx (más rápido)
npx tsx scripts/publish.ts
```

### Flujo

1. Inicialización (categorías, artículos recientes)
2. Fetch noticias desde fuentes RSS
3. Generación IA (Gemini → Ollama → fallback)
4. Traducción y post-procesado
5. Pipeline de imagen
6. Guardar en BD
7. Publicar en redes (opcional)

### Dependencias

- `modules/news/news-sources.service`
- `modules/ai/ai.service`
- `modules/images/image.service`
- `@prisma/client`

### Errores

- Si todas las IAs fallan → Avisa por Telegram + exit(1)
- Si el pipeline de imagen falla → Usa fallback de Unsplash

### Referencias
- [[Flujo de Publicación]]

---

## force-generate.ts

**Ubicación**: `scripts/force-generate.ts`

### Descripción

Fuerza la generación de un artículo bypassing las verificaciones de duplicados.

### Uso

```bash
npx tsx scripts/force-generate.ts
```

---

## publish_test.ts

**Ubicación**: `scripts/publish_test.ts`

### Descripción

Versión de prueba del pipeline sin publicar en BD.

### Uso

```bash
npx tsx scripts/publish_test.ts
```

---

## send_newsletter.ts

**Ubicación**: `scripts/send_newsletter.ts`

### Descripción

Genera y envía el newsletter semanal a los suscriptores.

### Uso

```bash
npx tsx scripts/send_newsletter.ts
```

### Funcionalidad

1. Fetch últimos artículos de la semana
2. Generación de contenido del newsletter
3. Envío a través de Resend API
4. Actualizar estadísticas

### Dependencias

- `modules/newsletter/`
- `resend` (SDK)

---

## Scripts de Mantenimiento

### delete-duplicates.ts

```bash
npx tsx scripts/delete-duplicates.ts
```

### delete-external-images.ts

```bash
npx tsx scripts/delete-external-images.ts
```

### check-expired-images.ts

```bash
npx tsx scripts/check-expired-images.ts
```

---

## Referencias

- [[Cron Jobs]]
- [[Flujo de Publicación]]