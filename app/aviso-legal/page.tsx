import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Aviso Legal | ${siteConfig.name}`,
  description: `Información legal sobre el sitio web ${siteConfig.name}.`,
  robots: { index: false, follow: true },
};

export default function LegalNoticePage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Aviso Legal</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Última actualización: 8 de octubre de 2026</p>

          <p>El presente Aviso Legal regula el uso del sitio web <strong>{siteConfig.url}</strong> (en adelante, el Sitio Web), titularidad de <strong>{siteConfig.author}</strong>.</p>

          <h2>1. Datos Identificativos</h2>
          <p>En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, se detallan los siguientes datos:</p>
          <ul>
            <li><strong>Titular:</strong> {siteConfig.author}</li>
            <li><strong>Email de contacto:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Sitio Web:</strong> {siteConfig.url}</li>
          </ul>

          <h2>2. Usuarios y Uso del Sitio Web</h2>
          <p>El acceso y/o uso de este portal le atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. El USUARIO asume la responsabilidad del uso del portal.</p>

          <h2>3. Contenido, fuentes e imágenes</h2>
          <p>
            Este medio publica información elaborada a partir de <strong>fuentes periodísticas
            publicadas por terceros</strong>. Cada artículo indica al final la fuente original y
            enlaza a ella, de modo que el lector pueda consultar la cobertura completa en el medio
            que la realizó. Ese enlace es la vía por la que este Sitio Web se refiere al trabajo
            ajeno.
          </p>
          <p>
            <strong>Este Sitio Web no reproduce ni reutiliza imágenes de otros medios.</strong> Las
            imágenes que ilustran los artículos proceden exclusivamente de:
          </p>
          <ul>
            <li><strong>Generación con inteligencia artificial</strong>, cuando no hay una fotografía con licencia adecuada. En ese caso el pie de foto lo indica expresamente.</li>
            <li><strong>Bancos de imágenes con licencia de uso comercial</strong> (por ejemplo, Pixabay), que autorizan su uso sin necesidad de autorización adicional.</li>
            <li><strong>Material propio</strong> del Sitio Web.</li>
          </ul>
          <p>
            Si usted es titular de derechos sobre algún contenido y considera que su uso no es
            correcto, puede escribirnos a <strong>carlosemerito13@gmail.com</strong> y lo revisaremos
            y, en su caso, lo retiraremos.
          </p>

          <h2>4. Uso de inteligencia artificial</h2>
          <p>
            Los artículos de este Sitio Web se redactan mediante <strong>sistemas de inteligencia
            artificial</strong> a partir de las fuentes citadas. Cada artículo incorpora un aviso
            visible en ese sentido, junto con metadatos legibles por máquina, en cumplimiento del
            <strong> artículo 50 del Reglamento (UE) 2024/1689</strong> (Reglamento de IA).
          </p>
          <p>
            El control de calidad editorial que se aplique en cada momento se describe en la{" "}
            <Link href="/politica-editorial">Política Editorial</Link>, que también identifica al
            responsable de la publicación.
          </p>

          <h2>5. Propiedad Intelectual e Industrial</h2>
          <p>
            <strong>{siteConfig.name}</strong> es titular de los derechos de propiedad intelectual
            sobre los elementos que ha creado para este Sitio Web: su código, su diseño, su
            estructura, sus textos y sus marcas y logotipos.
          </p>
          <p>
            <strong>La titularidad anterior no se extiende a contenidos de terceros.</strong> Las
            marcas, logotipos y nombres comerciales de empresas mencionadas en las informaciones
            pertenecen a sus respectivos titulares y se emplean únicamente con finalidad
            informativa. Las fotografías procedentes de bancos de imágenes con licencia se usan
            conforme a los términos de dichas licencias.
          </p>
          <p>
            Quedan prohibidas la reproducción, la distribución y la comunicación pública de los
            contenidos propios de este Sitio Web con fines comerciales, en cualquier soporte y por
            cualquier medio técnico, sin autorización de <strong>{siteConfig.name}</strong>. Los
            enlaces a este Sitio Web y la cita de fragmentos con mención de la fuente son libres.
          </p>

          <h2>6. Exclusión de Garantías y Responsabilidad</h2>
          <p>
            <strong>{siteConfig.name}</strong> no se hace responsable, en ningún caso, de los daños
            y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo:
            errores u omisiones en los contenidos, falta de disponibilidad del portal o la
            transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de
            haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
          </p>
          <p>
            Los contenidos de este sitio web son de carácter informativo y divulgativo.{" "}
            <strong>No constituyen asesoramiento financiero, legal o profesional de ningún tipo.</strong>{" "}
            Las decisiones de inversión son responsabilidad exclusiva del lector.
          </p>
          <p>
            Este Sitio Web incluye enlaces de afiliación y espacios publicitarios. Su presencia no
            condiciona el contenido editorial y se identifica como tal en la propia página.
          </p>

          <h2>7. Modificaciones</h2>
          <p><strong>{siteConfig.name}</strong> se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados en su portal.</p>

          <h2>8. Enlaces de Terceros</h2>
          <p>En el caso de que en el Sitio Web se dispusiesen enlaces o hipervínculos hacía otros sitios de Internet, <strong>{siteConfig.name}</strong> no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso asumirá responsabilidad alguna por los contenidos de algún enlace perteneciente a un sitio web ajeno.</p>

          <p>
            Ver también: <Link href="/politica-editorial">Política Editorial</Link>,{" "}
            <Link href="/politica-privacidad">Política de Privacidad</Link> y{" "}
            <Link href="/cookies">Política de Cookies</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
