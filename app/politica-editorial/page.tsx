import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Política Editorial | ${siteConfig.name}`,
  description: `Cómo se elabora, verifica y publica la información en ${siteConfig.name}.`,
};

export default function EditorialPolicyPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Política Editorial</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Última actualización: 8 de octubre de 2026</p>

          <p>
            Esta página explica <strong>quién responde</strong> de lo que se publica aquí,{" "}
            <strong>cómo se elabora</strong> la información y <strong>qué puedes exigirnos</strong>.
            No es un texto decorativo: es el compromiso con el que se publica este medio.
          </p>

          <h2>1. Responsable editorial</h2>
          <p>
            El responsable de los contenidos publicados en {siteConfig.name} es{" "}
            <strong>{siteConfig.author}</strong>, con contacto en{" "}
            <strong>carlosemerito13@gmail.com</strong>. Es la persona a la que dirigirse para
            cualquier corrección, reclamación o requerimiento relacionado con lo publicado.
          </p>

          <h2>2. Cómo se elabora la información</h2>
          <p>
            Este medio trabaja con un <strong>sistema automatizado</strong> que, a partir de fuentes
            periodísticas publicadas por otros medios, redacta y publica información de actualidad
            sobre criptomonedas, mercados, inteligencia artificial y ciberseguridad. El proceso es el
            siguiente:
          </p>
          <ol>
            <li>Se consultan las fuentes recogidas en un listado público y verificable de medios de referencia.</li>
            <li>Un modelo de lenguaje redacta el texto en español y su versión en inglés.</li>
            <li>El texto pasa por un control automático de forma y contenido.</li>
            <li>Se selecciona una imagen conforme al apartado 4 de esta política.</li>
            <li>El artículo se publica indicando al final <strong>la fuente original, con enlace</strong>.</li>
          </ol>
          <p>
            <strong>No se publica ningún texto de otro medio.</strong> La información se redacta de
            nuevo y se acompaña siempre del enlace a la cobertura original, que es donde el lector
            puede consultar el trabajo del medio que la realizó.
          </p>

          <h2>3. Uso de inteligencia artificial</h2>
          <p>
            La redacción de los artículos se apoya en <strong>sistemas de inteligencia artificial</strong>:
            un modelo de lenguaje prepara el borrador a partir de las fuentes citadas. Ese borrador
            <strong>no se publica sin más</strong>: pasa por la revisión y la aprobación del responsable
            editorial del apartado 1, que decide artículo por artículo si se publica, si se descarta o
            si se vuelve a redactar.
          </p>
          <p>
            Por eso los artículos no llevan un aviso individual de contenido generado con inteligencia
            artificial: la excepción del artículo 50.4 del Reglamento (UE) 2024/1689 se aplica cuando el
            contenido ha pasado una revisión humana y existe una persona con responsabilidad editorial
            sobre la publicación, que es este caso. Cada revisión y su resultado quedan registrados.
          </p>
          <p>
            <strong>La autoría y la responsabilidad son del responsable editorial</strong> indicado en el
            apartado 1. La inteligencia artificial es una herramienta de redacción, no la autora de la
            información.
          </p>

          <h2>4. Imágenes</h2>
          <p>
            Este medio <strong>no utiliza imágenes de otros medios de comunicación</strong>. Todas
            las imágenes que ilustran los artículos proceden de una de estas tres fuentes:
          </p>
          <ul>
            <li><strong>Generación con inteligencia artificial</strong>, cuando no hay una fotografía con licencia adecuada.</li>
            <li><strong>Bancos de imágenes con licencia de uso comercial</strong> que autorizan su utilización sin autorización adicional.</li>
            <li><strong>Material propio</strong> de este medio.</li>
          </ul>
          <p>
            La razón es sencilla: las imágenes ajenas requieren autorización de su titular, y este
            medio no cuenta con ella. Cuando una noticia necesita una imagen que no podemos obtener
            por las vías anteriores, se genera una ilustración y se dice que es una ilustración.
          </p>

          <h2>5. Publicidad y contenido comercial</h2>
          <p>
            Este medio se financia con espacios publicitarios y con enlaces de afiliación. Ambos se
            identifican como tales. <strong>La publicidad no condiciona el contenido editorial</strong>:
            ningún anunciante revisa ni aprueba los artículos, y no se publica contenido a cambio de
            una contraprestación sin decirlo.
          </p>

          <h2>6. Correcciones</h2>
          <p>
            Un sistema automatizado puede equivocarse. Si detectas un error, escríbenos a{" "}
            <strong>carlosemerito13@gmail.com</strong> indicando el artículo y el dato que crees
            incorrecto. Nos comprometemos a:
          </p>
          <ul>
            <li>Revisarlo y corregir el artículo si el error se confirma.</li>
            <li>Dejar constancia de la corrección cuando el cambio sea sustancial.</li>
            <li>Retirar el contenido si afecta a derechos de terceros y no puede corregirse.</li>
          </ul>
          <p>
            Si eres titular de derechos sobre un contenido y consideras que su uso no es correcto,
            escríbenos por la misma vía. Retiraremos o sustituiremos el contenido mientras se revisa.
          </p>

          <h2>7. Compromisos</h2>
          <ul>
            <li>No publicar información que no podamos atribuir a una fuente identificable.</li>
            <li>Enlazar siempre al medio que publicó la información original.</li>
            <li>Publicar solo contenido revisado y aprobado por el responsable editorial.</li>
            <li>No usar imágenes ni textos de terceros sin autorización o licencia.</li>
            <li>Separar la publicidad del contenido editorial.</li>
            <li>Corregir los errores cuando se nos señalen.</li>
          </ul>

          <p>
            Ver también: <Link href="/aviso-legal">Aviso Legal</Link>,{" "}
            <Link href="/politica-privacidad">Política de Privacidad</Link> y{" "}
            <Link href="/cookies">Política de Cookies</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
