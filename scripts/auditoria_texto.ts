/**
 * Auditoría de estilo de los artículos, para medir con datos si el prompt
 * cumple lo que promete: entradilla que no repite el titular, atribuciones,
 * cifras con unidad, incertidumbre contenida y longitud.
 *
 * Uso:
 *   npx tsx scripts/auditoria_texto.ts            # últimos 15 artículos publicados
 *   npx tsx scripts/auditoria_texto.ts --draft    # el último borrador (antes de aprobar)
 *   npx tsx scripts/auditoria_texto.ts --n 30     # otra cantidad
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LIMPIAR = /<[^>]+>/g;
const texto = (html: string) => html.replace(LIMPIAR, ' ').replace(/\s+/g, ' ').trim();
const CUENTA = (t: string, patron: RegExp) => (t.match(patron) || []).length;

async function main() {
  const args = process.argv.slice(2);
  const soloBorrador = args.includes('--draft');
  const nArg = args.indexOf('--n');
  const limite = nArg !== -1 ? Number(args[nArg + 1]) || 15 : 15;

  const arts = await prisma.article.findMany({
    where: soloBorrador ? { published: false } : { published: true },
    orderBy: { createdAt: 'desc' },
    take: soloBorrador ? 1 : limite,
    select: {
      title: true, summary: true, keyPoints: true, content: true, textQa: true,
      articleTags: { select: { name: true } },
    },
  });

  if (arts.length === 0) {
    console.log(soloBorrador ? 'No hay ningún borrador.' : 'No hay artículos publicados.');
    return;
  }

  let sumPalabras = 0, sumH2 = 0;
  const acum = {
    repite: 0, pregunta: 0, enResumen: 0, hedging: 0, segun: 0, cifras: 0, largos: 0, total: 0,
  };

  console.log('ARTÍCULO                                     PALABRAS  H2  PUNTOS  TAGS  REPITE-TITULAR  «EN RESUMEN»  «podría»');
  for (const a of arts) {
    const cuerpo = texto(a.content);
    const frases = cuerpo.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/);
    const entradilla = frases.slice(0, 2).join(' ');
    const palabras = cuerpo.split(/\s+/).filter(Boolean).length;
    const h2 = CUENTA(a.content, /<h2/g);
    // Ojo: se compara por palabras del titular, así que los nombres propios del
    // asunto cuentan como repetición aunque la entradilla aporte datos nuevos.
    const tituloPalabras = texto(a.title).toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const repite = tituloPalabras.some((w) => entradilla.toLowerCase().includes(w.replace(/[^\wáéíóúñ]/g, '')));

    sumPalabras += palabras; sumH2 += h2;
    acum.total++;
    if (repite) acum.repite++;
    if (/\?/.test(frases[0] || '')) acum.pregunta++;
    if (/en resumen|en conclusión|en definitiva/i.test(cuerpo)) acum.enResumen++;
    acum.hedging += CUENTA(cuerpo, /\b(podría|podrían|posiblemente|probablemente|al parecer)\b/gi);
    acum.segun += CUENTA(cuerpo, /según\b/gi);
    acum.cifras += CUENTA(cuerpo, /\b\d[\d.,]*\s*(%|millones|mil millones|billones|dólares|euros|BTC|ETH)\b/gi);
    acum.largos += frases.filter((p) => p.split(/\s+/).length > 55).length;

    console.log(
      `${a.title.slice(0, 42).padEnd(44)} ${String(palabras).padStart(6)} ${String(h2).padStart(4)} ${String(a.keyPoints.length).padStart(6)} ${String(a.articleTags.length).padStart(5)} ${String(repite).padStart(14)} ${String(/en resumen|en conclusión|en definitiva/i.test(cuerpo)).padStart(13)} ${String(CUENTA(cuerpo, /\b(podría|podrían|posiblemente|probablemente)\b/gi)).padStart(9)}`
    );

    if (soloBorrador) {
      console.log('\nRESUMEN   :', a.summary, `(${(a.summary || '').length} caracteres)`);
      console.log('PUNTOS    :', JSON.stringify(a.keyPoints));
      console.log('TAGS      :', JSON.stringify(a.articleTags.map((t) => t.name)));
      console.log('CONTROL DE TEXTO:');
      console.log(a.textQa ? a.textQa.split('\n').map((l) => `  ${l}`).join('\n') : '  (sin registro)');
      console.log('\n--- ENTRADILLA (primeros 700 caracteres) ---');
      console.log(cuerpo.slice(0, 700));
    }
  }

  const n = arts.length || 1;
  console.log('\n--- MEDIAS Y TOTALES (' + (soloBorrador ? 'el último borrador' : `últimos ${n} publicados`) + ') ---');
  if (!soloBorrador) {
    console.log('palabras por artículo :', Math.round(sumPalabras / n), '| subtítulos h2:', (sumH2 / n).toFixed(1));
    console.log('repiten el titular en la entradilla :', acum.repite, '/', n);
    console.log('entradilla con interrogación        :', acum.pregunta, '/', n);
    console.log('cierran con «en resumen/conclusión» :', acum.enResumen, '/', n);
    console.log('«podría/posiblemente/probablemente» :', acum.hedging, '(' + (acum.hedging / n).toFixed(1) + ' por artículo)');
    console.log('cifras con unidad                   :', acum.cifras, '(' + (acum.cifras / n).toFixed(1) + ' por artículo)');
    console.log('atribuciones «según…»               :', acum.segun, '(' + (acum.segun / n).toFixed(1) + ' por artículo)');
    console.log('párrafos de más de 55 palabras      :', acum.largos, '(' + (acum.largos / n).toFixed(1) + ' por artículo)');
  } else {
    console.log('palabras:', sumPalabras, '| h2:', sumH2, '| «según»:', acum.segun, '| «podría»:', acum.hedging, '| cifras:', acum.cifras);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
