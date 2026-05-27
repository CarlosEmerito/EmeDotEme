import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Aviso Legal | ${siteConfig.name}`,
  description: `Información legal sobre el sitio web ${siteConfig.name}.`,
};

export default function LegalNoticePage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Aviso Legal</h1>
        
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p>El presente Aviso Legal regula el uso del sitio web <strong>{siteConfig.url}</strong> (en adelante, el Sitio Web), titularidad de <strong>{siteConfig.author}</strong>.</p>
          
          <h2>1. Datos Identificativos</h2>
          <p>En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, se detallan los siguientes datos:</p>
          <ul>
            <li><strong>Titular:</strong> {siteConfig.author}</li>
            <li><strong>Email de contacto:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Sitio Web:</strong> {siteConfig.url}</li>
          </ul>

          <h2>2. Usuarios y Uso del Sitio Web</h2>
          <p>El acceso y/o uso de este portal le atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. El Sitio Web proporciona el acceso a multitud de informaciones, servicios, programas o datos (en adelante, &quot;los contenidos&quot;) en Internet pertenecientes a <strong>{siteConfig.name}</strong> o a sus licenciantes.</p>
          <p>El USUARIO asume la responsabilidad del uso del portal. Dicha responsabilidad se extiende al registro que fuese necesario para acceder a determinados servicios o contenidos.</p>

          <h2>3. Propiedad Intelectual e Industrial</h2>
          <p><strong>{siteConfig.name}</strong> por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.).</p>
          <p>Quedan expresamente prohibidas la reproducción, la distribución y la comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos de esta página web, con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización de <strong>{siteConfig.name}</strong>.</p>

          <h2>4. Exclusión de Garantías y Responsabilidad</h2>
          <p><strong>{siteConfig.name}</strong> no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.</p>
          <p>Los contenidos de este sitio web son de carácter informativo y divulgativo. No constituyen asesoramiento financiero, legal o profesional de ningún tipo.</p>

          <h2>5. Modificaciones</h2>
          <p><strong>{siteConfig.name}</strong> se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados en su portal.</p>

          <h2>6. Enlaces de Terceros</h2>
          <p>En el caso de que en el Sitio Web se dispusiesen enlaces o hipervínculos hacía otros sitios de Internet, <strong>{siteConfig.name}</strong> no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso asumirá responsabilidad alguna por los contenidos de algún enlace perteneciente a un sitio web ajeno.</p>
        </div>
      </main>
    </div>
  );
}
