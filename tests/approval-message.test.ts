import { describe, it } from "node:test";
import assert from "node:assert";
import {
  composeApprovalCaption,
  recortar,
  recortarAvisoQa,
  AFIRMACION_MAX,
  LIMITE_PIE_TELEGRAM,
  type ApprovalMessageInput,
} from "../modules/notifications/approval-message.js";

/**
 * El mensaje de aprobación es la única puerta al borrador: si el enlace privado
 * se recorta, Emérito decide a ciegas. Estas pruebas fijan las dos reglas que
 * rompió el primer diseño (avisos largos comiéndose el final y citas cortadas a
 * mitad).
 */

const ENLACE = "https://www.emedoteme.es/preview/0123456789abcdef0123456789abcdef";

function base(extra: Partial<ApprovalMessageInput> = {}): ApprovalMessageInput {
  return {
    title: "Las acciones de Olympus, J.Front Retailing y Aeon registran caídas bursátiles",
    previewUrl: ENLACE,
    summary:
      "Investing.com reporta caídas en la cotización de Olympus, J.Front Retailing y Aeon el 14 de octubre de 2026, mediante tres alertas emitidas de forma consecutiva.",
    imageNote: "🖼️ Imagen: foto de archivo de Pixabay (licencia comercial)",
    imageCaption:
      "Vista interior de un centro comercial de varios niveles con personas caminando y escaleras mecánicas.",
    category: "Mercados",
    wordCount: 483,
    ...extra,
  };
}

/** Aviso del control de texto del tamaño real que llegó a romper el mensaje. */
function avisoLargo(repeticiones = 6): string {
  const lineas = [
    "⚠️ Control de texto: 2 afirmación(es) sin respaldo y 1 incumplimiento(s) de estilo.",
    "Reescrito una vez: quedan 2 sin respaldo.",
    "Afirmaciones señaladas:",
  ];
  for (let i = 0; i < repeticiones; i += 1) {
    lineas.push(
      `- «una cita del artículo absolutamente larguísima número ${i + 1} que no cabe de ninguna manera» → Las fuentes no mencionan ese extremo ni nada parecido.`
    );
  }
  return lineas.join("\n");
}

describe("mensaje de aprobación por Telegram", () => {
  it("no recorta el enlace privado aunque el aviso del control de texto sea enorme", () => {
    const caption = composeApprovalCaption(base({ textQaNote: avisoLargo() }));

    assert.ok(caption.length <= LIMITE_PIE_TELEGRAM, `pie de ${caption.length} caracteres`);
    assert.ok(caption.includes(ENLACE), "el enlace privado tiene que ir entero");
    assert.match(caption, /Control de texto/);
  });

  it("aguanta un titular absurdo sin perder el enlace ni pasar del tope", () => {
    const caption = composeApprovalCaption(
      base({ title: "Titular enorme ".repeat(40), textQaNote: avisoLargo(10) })
    );

    assert.ok(caption.length <= LIMITE_PIE_TELEGRAM);
    assert.ok(caption.includes(ENLACE));
  });

  it("mantiene el enlace con el aviso descomunal y un resumen al máximo", () => {
    const caption = composeApprovalCaption(
      base({ summary: "resumen ".repeat(200), textQaNote: avisoLargo(30) })
    );

    assert.ok(caption.length <= LIMITE_PIE_TELEGRAM);
    assert.ok(caption.includes(ENLACE));
  });

  it("recorta el aviso por líneas y avisa de que hay más", () => {
    const caption = composeApprovalCaption(base({ textQaNote: avisoLargo() }));
    const aviso = caption.split("\n\n").find((p) => p.startsWith("⚠️"));

    assert.ok(aviso, "falta el bloque del control de texto");
    const lineas = aviso.split("\n");
    assert.ok(lineas.length >= 2, "el veredicto tiene que conservarse");
    assert.strictEqual(lineas[lineas.length - 1], "…", "queda algo fuera: se marca con «…»");
    // Ninguna afirmación viaja entera: cada línea va acotada.
    for (const linea of lineas.slice(1, -1)) {
      assert.ok(linea.length <= AFIRMACION_MAX, `línea de ${linea.length} caracteres`);
    }
  });

  it("con aviso corto lo escribe entero y sin marcas de recorte", () => {
    const corto = "✅ Control de texto: sin incidencias (revisado contra las fuentes).";
    const caption = composeApprovalCaption(base({ textQaNote: corto }));

    assert.ok(caption.includes(corto));
    assert.ok(caption.includes(ENLACE));
  });

  it("escapa el HTML del artículo y no se traga etiquetas ajenas", () => {
    const caption = composeApprovalCaption(
      base({ title: "<script>alert('x')</script> Ojo & cuidado", summary: "Resumen con <b>negrita</b>" })
    );

    assert.ok(!caption.includes("<script>"));
    assert.ok(caption.includes("&lt;script&gt;"));
    assert.ok(caption.includes("&amp;"));
  });

  it("no deja un emoji partido al recortar", () => {
    const caption = composeApprovalCaption(base({ summary: "😀".repeat(400) }));

    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(caption), "par subrogado suelto en el pie");
    assert.ok(caption.length <= LIMITE_PIE_TELEGRAM);
  });

  it("no cuela bloques vacíos cuando faltan datos", () => {
    const caption = composeApprovalCaption({
      title: "Solo titular",
      previewUrl: ENLACE,
    });

    assert.ok(!caption.includes("\n\n\n"));
    assert.ok(!caption.includes("undefined"));
    assert.ok(!caption.includes("null"));
    assert.ok(caption.includes(ENLACE));
    assert.ok(caption.includes("General"));
  });

  it("el enlace va antes del pie de categoría", () => {
    const caption = composeApprovalCaption(base());
    const posEnlace = caption.indexOf("🔒");
    const posPie = caption.indexOf("<i>Mercados");

    assert.ok(posEnlace > 0 && posPie > posEnlace, "el pie de categoría debe ser lo último");
  });

  it("respeta el orden de lectura: titular, resumen, imagen, control de texto, enlace", () => {
    const caption = composeApprovalCaption(base({ textQaNote: avisoLargo() }));
    const posiciones = {
      titulo: caption.indexOf("<b>Las acciones"),
      resumen: caption.indexOf("Investing.com reporta"),
      imagen: caption.indexOf("🖼️ Imagen"),
      pieDeFoto: caption.indexOf("Pie de foto"),
      control: caption.indexOf("Control de texto"),
      enlace: caption.indexOf("🔒"),
    };

    for (const [nombre, pos] of Object.entries(posiciones)) {
      assert.ok(pos > 0, `falta el bloque ${nombre}`);
    }
    assert.deepStrictEqual(
      Object.entries(posiciones).map(([k]) => k),
      ["titulo", "resumen", "imagen", "pieDeFoto", "control", "enlace"],
      "orden inesperado"
    );
    const orden = Object.values(posiciones);
    assert.deepStrictEqual([...orden].sort((a, b) => a - b), orden);
  });

  it("junta la procedencia de la imagen con el pie de foto en un solo bloque", () => {
    const caption = composeApprovalCaption(base());
    const porBloques = caption.split("\n\n");

    assert.ok(
      porBloques.some((b) => b.startsWith("🖼️ Imagen") && b.includes("Pie de foto")),
      "la procedencia y el pie de foto van pegados"
    );
  });

  it("«recortar» no devuelve más de lo pedido", () => {
    for (const limite of [1, 5, 40, 140]) {
      assert.ok(recortar("palabra ".repeat(50), limite).length <= limite);
      assert.ok(recortar("😀".repeat(50), limite).length <= limite);
    }
    assert.strictEqual(recortar("", 10), "");
    assert.strictEqual(recortar("corto", 0), "");
  });

  it("«recortarAvisoQa» devuelve null cuando no hay hueco real", () => {
    assert.strictEqual(recortarAvisoQa("⚠️ algo", 10), null);
    assert.strictEqual(recortarAvisoQa(null, 500), null);
    assert.ok(recortarAvisoQa(avisoLargo(), 90));
  });
});
