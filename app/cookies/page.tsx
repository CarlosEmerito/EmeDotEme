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
          <p>Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p>Este sitio web, al igual que la mayoría de los sitios en Internet, utiliza cookies para mejorar y optimizar la experiencia del usuario. A continuación, encontrará información detallada sobre qué son las cookies, qué tipos utiliza este sitio web, cómo puede desactivarlas en su navegador y cómo bloquear específicamente la instalación de cookies de terceros.</p>
          
          <h2>1. ¿Qué son las cookies?</h2>
          <p>Las cookies son archivos que el sitio web o la aplicación que utiliza instala en su navegador o en su dispositivo durante su recorrido por las páginas, y sirven para almacenar información sobre su visita. Como la mayoría de los sitios en internet, <strong>{siteConfig.name}</strong> utiliza cookies para:</p>
          <ul>
            <li>Asegurar que las páginas web pueden funcionar correctamente.</li>
            <li>Almacenar sus preferencias, como el idioma seleccionado o el tamaño de letra.</li>
            <li>Conocer su experiencia de navegación.</li>
            <li>Recopilar información estadística anónima, como qué páginas ha visto o cuánto tiempo ha estado en nuestros medios.</li>
          </ul>

          <h2>2. Cookies utilizadas en este sitio</h2>
          <p>A continuación se detalla una tabla con las cookies utilizadas en este sitio web:</p>
          
          <div className="overflow-x-auto my-8">
            <table className="min-w-full text-sm text-left border-collapse border border-zinc-200 dark:border-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Tipo</th>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Nombre</th>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Propósito</th>
                  <th className="p-3 border border-zinc-200 dark:border-zinc-800">Proveedor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Técnicas</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">next-themes</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Gestiona la preferencia del tema oscuro/claro.</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Propia</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Análisis</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">_ga, _gid</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Recopila información anónima sobre la navegación.</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Google Analytics</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Publicidad</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">__gads, IDE</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Sirve anuncios basados en visitas anteriores.</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">Google AdSense</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Gestión de cookies</h2>
          <p>Al navegar y continuar en nuestro Sitio Web estará consintiendo el uso de las Cookies en las condiciones contenidas en la presente Política de Cookies. No obstante, usted tiene la opción de ejercer su derecho a bloquear, eliminar y rechazar el uso de Cookies en todo momento a través de la configuración de su navegador.</p>
          
          <p>Puede encontrar información sobre cómo gestionar las cookies en los navegadores más comunes en los siguientes enlaces:</p>
          <ul>
            <li><strong>Google Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
            <li><strong>Mozilla Firefox:</strong> <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
            <li><strong>Internet Explorer:</strong> <a href="https://support.microsoft.com/es-es/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
            <li><strong>Safari:</strong> <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
          </ul>

          <p>Tenga en cuenta que si decide bloquear o eliminar las cookies, es posible que no podamos mantener sus preferencias y que algunas características del sitio web no estén operativas, o que tengamos que solicitarle de nuevo autorización para su uso.</p>
        </div>
      </main>
    </div>
  );
}
