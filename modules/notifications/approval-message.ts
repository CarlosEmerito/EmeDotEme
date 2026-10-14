/**
 * Composición del mensaje de aprobación editorial (Telegram).
 *
 * Vive aparte del transporte (`telegram.service.ts`) para poder probarlo sin
 * red: es texto puro, y es el único sitio donde se decide **qué cabe** en el
 * pie de foto.
 *
 * Dos reglas que costaron caras y no se pueden romper:
 *
 *  1. **El enlace privado nunca se recorta.** Telegram limita el pie de foto a
 *     1024 caracteres y el aviso del control de texto era el último bloque:
 *     con avisos de 600-900 caracteres se comía el final del mensaje y el
 *     enlace desaparecía (10 de los primeros 20 mensajes salieron recortados;
 *     9 de ellos sin enlace, así que el borrador no se podía abrir desde el
 *     móvil). Aquí el presupuesto se reparte al revés: cabecera, título,
 *     bloques de imagen, enlace y pie se reservan primero, y lo que sobra se
 *     reparte entre el resumen y el aviso. El pie de categoría es lo único que
 *     puede caer en el peor de los casos.
 *  2. **El aviso del control de texto se recorta por líneas**, nunca a mitad de
 *     una cita: primero el veredicto, después las afirmaciones señaladas, cada
 *     una acotada (`AFIRMACION_MAX`) y con un «…» cuando algo queda fuera.
 */

/** Tope de Telegram para el pie de foto de un `sendPhoto`. */
export const LIMITE_PIE_TELEGRAM = 1024;
/** Longitud máxima del resumen dentro del mensaje. */
export const RESUMEN_MAX = 400;
/** Longitud máxima de cada afirmación señalada por el control de texto. */
export const AFIRMACION_MAX = 140;
/** Holgura frente al tope: absorbe redondeos y el «…» del último recorte. */
export const RESERVA_SEGURIDAD = 24;

export interface ApprovalMessageInput {
  title: string;
  previewUrl: string;
  summary?: string | null;
  imageNote?: string | null;
  imageCaption?: string | null;
  imageWarning?: string | null;
  textQaNote?: string | null;
  category?: string | null;
  wordCount?: number | string | null;
}

/** Escapa lo que escribe el artículo (nunca el HTML que añadimos nosotros). */
export function escapeHtml(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unir(piezas: Array<string | null | undefined | false>): string {
  return piezas
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join('\n\n');
}

function acotar(valor: number, minimo: number, maximo: number): number {
  if (!Number.isFinite(valor)) return minimo;
  return Math.min(Math.max(Math.floor(valor), minimo), maximo);
}

/**
 * Recorta un texto a `limite` caracteres sin partir palabras, emojis ni
 * entidades HTML a medias, y marca el corte con «…».
 */
export function recortar(texto: string | null | undefined, limite: number): string {
  const limpio = String(texto ?? '').trim();
  if (limite <= 0 || !limpio) return '';
  if (limpio.length <= limite) return limpio;

  let corte = limpio.slice(0, Math.max(limite - 1, 0));
  // Un emoji partido por la mitad (par subrogado suelto) deja un carácter roto.
  if (/[\uD800-\uDBFF]$/.test(corte)) corte = corte.slice(0, -1);
  // `&amp;` cortado a medias se vería como «&am…» en el mensaje.
  corte = corte.replace(/&[a-zA-Z]{0,6}$/, '');

  const hastaLaPalabra = corte.replace(/\s+\S*$/, '');
  if (hastaLaPalabra.length >= Math.floor(limite * 0.6)) corte = hastaLaPalabra;

  return `${corte.trimEnd()}…`.slice(0, limite);
}

/**
 * Recorta el aviso del control de texto respetando su estructura por líneas:
 * la primera (el veredicto) manda, las siguientes son las afirmaciones
 * señaladas. Si algo no cabe se cierra con «…».
 */
export function recortarAvisoQa(nota: string | null | undefined, limite: number): string | null {
  const texto = String(nota ?? '').trim();
  if (!texto || limite < 40) return null;
  if (texto.length <= limite) return texto;

  const lineas = texto
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean);

  const salida: string[] = [];
  let usado = 0;
  let quedanFuera = 0;

  for (let i = 0; i < lineas.length; i += 1) {
    const linea = lineas[i];
    const tope = i === 0 ? linea.length : Math.min(linea.length, AFIRMACION_MAX);
    const trozo = recortar(linea, tope);
    const coste = trozo.length + (salida.length > 0 ? 1 : 0);
    if (usado + coste > limite) {
      quedanFuera = lineas.length - i;
      break;
    }
    salida.push(trozo);
    usado += coste;
  }

  if (salida.length === 0) return null;
  if (quedanFuera > 0) salida.push('…');
  return salida.join('\n');
}

/**
 * Monta el pie de foto del mensaje de aprobación.
 *
 * El enlace privado va **después** del aviso y antes del pie de categoría: con
 * el presupuesto calculado aquí nunca se recorta, y si algo tuviera que caer en
 * el último momento sería la línea de categoría y palabras, no el enlace.
 */
export function composeApprovalCaption(input: ApprovalMessageInput): string {
  const cabecera = '🗞️ <b>Artículo listo para revisar</b>';
  const titulo = `<b>${escapeHtml(input.title)}</b>`;

  // La procedencia y el pie de foto van juntos, pegados (una línea cada uno).
  const bloqueImagen = [
    input.imageNote ? escapeHtml(input.imageNote) : null,
    input.imageCaption ? `Pie de foto: <i>${escapeHtml(input.imageCaption)}</i>` : null,
  ].filter((linea): linea is string => Boolean(linea)).join('\n');
  const avisoImagen = input.imageWarning ? `<b>${escapeHtml(input.imageWarning)}</b>` : null;

  const enlace = `🔒 Enlace privado: ${input.previewUrl}`;
  const pie = `<i>${escapeHtml(input.category || 'General')}${
    input.wordCount ? ` · ${input.wordCount} palabras` : ''
  }</i>`;

  const util = LIMITE_PIE_TELEGRAM - RESERVA_SEGURIDAD;
  // Reservado: todo lo que no se recorta y no depende del tamaño del texto
  // generado. Los 4 caracteres son los separadores que añadirán el resumen y el
  // aviso si llegan a entrar.
  const reservado = unir([cabecera, titulo, bloqueImagen, avisoImagen, enlace, pie]).length;
  const hueco = Math.max(util - reservado - 4, 0);

  // Con aviso de control de texto, una parte del hueco se guarda para su
  // veredicto: es lo que decide si merece la pena abrir el borrador.
  const hayAviso = String(input.textQaNote ?? '').trim().length > 0;
  const reservaAviso = hayAviso ? Math.min(140, Math.max(60, Math.floor(hueco * 0.4))) : 0;

  const resumen = recortar(input.summary, acotar(hueco - reservaAviso, 0, RESUMEN_MAX));
  const huecoAviso = hueco - (resumen ? resumen.length + 2 : 0);
  const aviso = recortarAvisoQa(input.textQaNote, Math.max(huecoAviso, 0));

  // Orden de lectura: titular, resumen, imagen, control de texto, enlace y pie.
  // El enlace queda justo encima de los botones, que es donde se busca.
  const mensaje = unir([cabecera, titulo, resumen, bloqueImagen, avisoImagen, aviso, enlace, pie]);
  // Red de seguridad: solo podría alcanzar al pie de categoría, que va el
  // último; el enlace queda protegido por el reparto de arriba.
  return mensaje.length > LIMITE_PIE_TELEGRAM ? mensaje.slice(0, LIMITE_PIE_TELEGRAM) : mensaje;
}
