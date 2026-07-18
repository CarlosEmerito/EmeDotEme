import sanitizeHtml from 'sanitize-html';

/**
 * Sanitiza el HTML generado por la IA (o editado en el panel admin) antes de
 * renderizarlo con dangerouslySetInnerHTML. El contenido de los artículos nace
 * de fuentes RSS externas no confiables, pasa por un LLM y podría contener
 * marcado inyectado (prompt injection) — este es el punto de defensa final.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'blockquote', 'code', 'pre', 'br'],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
    },
  });
}

/**
 * Serializa un objeto para insertarlo en un <script type="application/ld+json">
 * escapando '<' para que un valor como '</script><script>...' (p.ej. un título
 * generado por IA) no pueda cerrar el tag y ejecutar código en la página.
 */
export function safeJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
