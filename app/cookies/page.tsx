import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Política de Cookies | ${siteConfig.name}`,
  description: `Información sobre el uso de cookies en ${siteConfig.name}.`,
};

export default function CookiesPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Política de Cookies</h1>
        
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Este sitio web, al igual que la mayoría de los sitios en Internet, utiliza cookies para mejorar y optimizar la experiencia del usuario.</p>
          
          <h2>1. ¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos que el sitio web o la aplicación que utilizas instala en tu navegador o en tu dispositivo (Smartphone, tableta o televisión conectada) durante tu recorrido por las páginas o por la aplicación, y sirven para almacenar información sobre tu visita.</p>

          <h2>2. Tipos de cookies que utiliza este sitio</h2>
          <ul>
            <li><strong>Cookies técnicas:</strong> Son aquellas que permiten al usuario la navegación a través de una página web y la utilización de las diferentes opciones o servicios que en ella existan.</li>
            <li><strong>Cookies de personalización:</strong> Permiten al usuario acceder al servicio con algunas características de carácter general predefinidas en función de una serie de criterios en el terminal del usuario (por ejemplo, el idioma o el tema oscuro/claro).</li>
            <li><strong>Cookies de análisis:</strong> Son aquellas que, tratadas por nosotros o por terceros, nos permiten cuantificar el número de usuarios y así realizar la medición y análisis estadístico de la utilización que hacen los usuarios del servicio ofertado.</li>
            <li><strong>Cookies publicitarias:</strong> Son aquellas que, tratadas por nosotros o por terceros, nos permiten gestionar de la forma más eficaz posible la oferta de los espacios publicitarios que hay en la página web.</li>
          </ul>

          <h2>3. Cookies de terceros</h2>
          <p>En particular, este sitio web utiliza <strong>Google Analytics</strong> y <strong>Google AdSense</strong>, servicios analíticos y publicitarios prestados por Google, Inc. con domicilio en los Estados Unidos. Para la prestación de estos servicios, estos utilizan cookies que recopilan la información, incluida la dirección IP del usuario, que será transmitida, tratada y almacenada por Google en los términos fijados en la Web Google.com.</p>

          <h2>4. Cómo gestionar las cookies</h2>
          <p>El usuario puede en cualquier momento elegir qué cookies quiere que funcionen en este sitio web mediante la configuración del navegador:</p>
          <ul>
            <li>Para <strong>Chrome</strong>, ver <a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank">este enlace</a>.</li>
            <li>Para <strong>Explorer</strong>, ver <a href="https://support.microsoft.com/es-es/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank">este enlace</a>.</li>
            <li>Para <strong>Firefox</strong>, ver <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-que-los-sitios-we" target="_blank">este enlace</a>.</li>
            <li>Para <strong>Safari</strong>, ver <a href="https://support.apple.com/kb/ph21411?locale=es_ES" target="_blank">este enlace</a>.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
