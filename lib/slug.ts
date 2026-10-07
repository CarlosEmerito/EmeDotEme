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

/**
 * Devuelve un slug único para un artículo. Parte de un slug base "limpio" (sin
 * timestamp) y, si ya existe, añade un sufijo numérico incremental.
 *
 * `isTaken` recibe un slug y responde si ya está en uso (normalmente
 * `(s) => prisma.article.findUnique({ where: { slug: s } }).then(Boolean)`).
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const cleanBase = baseSlug.replace(/^-+|-+$/g, '') || 'articulo';
  if (!(await isTaken(cleanBase))) return cleanBase;

  let counter = 2;
  while (await isTaken(`${cleanBase}-${counter}`)) {
    counter++;
  }
  return `${cleanBase}-${counter}`;
}
