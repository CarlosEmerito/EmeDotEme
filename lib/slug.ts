/**
 * Genera un slug URL-friendly a partir de un título.
 * Opcionalmente añade un timestamp para unicidad.
 */
export function generateSlug(title: string, appendTimestamp: boolean = true): string {
  let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  if (appendTimestamp) {
    slug += '-' + Date.now();
  }
  return slug;
}
