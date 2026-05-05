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
          <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSICE), se exponen a continuación los datos identificativos del titular del sitio web:</p>
          
          <ul>
            <li><strong>Titular:</strong> {siteConfig.author}</li>
            <li><strong>Email:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Sitio Web:</strong> {siteConfig.url}</li>
          </ul>

          <h2>1. Propiedad Intelectual</h2>
          <p>El código fuente, los diseños gráficos, las imágenes, las fotografías, los sonidos, las animaciones, el software, los textos, así como la información y los contenidos que se recogen en el presente sitio web están protegidos por la legislación española sobre los derechos de propiedad intelectual e industrial a favor de <strong>{siteConfig.name}</strong>.</p>

          <h2>2. Exclusión de Responsabilidad</h2>
          <p><strong>{siteConfig.name}</strong> no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.</p>
          <p>El contenido de este sitio web es meramente informativo y no constituye consejo financiero ni de inversión.</p>

          <h2>3. Enlaces</h2>
          <p>En el caso de que en nombre del dominio se dispusiesen enlaces o hipervínculos hacía otros sitios de Internet, {siteConfig.name} no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso {siteConfig.name} asumirá responsabilidad alguna por los contenidos de algún enlace perteneciente a un sitio web ajeno.</p>

          <h2>4. Legislación Aplicable y Jurisdicción</h2>
          <p>La relación entre {siteConfig.name} y el usuario se regirá por la normativa española vigente y cualquier controversia se someterá a los Juzgados y tribunales de la ciudad de residencia del titular.</p>
        </div>
      </main>
    </div>
  );
}
