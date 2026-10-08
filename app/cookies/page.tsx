import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CookieSettingsLink } from "@/components/layout/consent";

export const metadata: Metadata = {
  title: `Política de Cookies | ${siteConfig.name}`,
  description: `Información sobre el uso de cookies y almacenamiento local en ${siteConfig.name}.`,
  robots: { index: false, follow: true },
};

const CELDA = "p-3 border border-zinc-200 dark:border-zinc-800";

export default function CookiesPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Política de Cookies</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Última actualización: 8 de octubre de 2026</p>

          <h2>1. Cómo funciona el consentimiento en este sitio</h2>
          <p>
            <strong>No se instala ningún almacenamiento no esencial antes de que usted decida.</strong>{" "}
            La primera vez que entra aparece un aviso con dos opciones: <em>«Aceptar todas»</em> y{" "}
            <em>«Solo las necesarias»</em>. Ambas tienen la misma prominencia, y la segunda no
            degrada su experiencia: la web funciona igual.
          </p>
          <p>
            Puede cambiar de opinión cuando quiera. Este botón reabre el aviso y su elección se
            aplica al momento:
          </p>
          <p>
            <CookieSettingsLink className="inline-block px-4 py-2 text-sm font-semibold rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" />
          </p>
          <p>
            Su decisión se guarda en el almacenamiento local de su navegador, bajo la clave{" "}
            <code>eme-cookie-consent-v1</code>. No es una cookie y no se envía a ningún servidor.
          </p>

          <h2>2. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son archivos que el sitio web instala en su navegador durante su visita.
            Algunas son imprescindibles para que la página funcione; otras sirven para medir
            audiencia o mostrar publicidad. En este sitio la mayoría de las funciones que suelen
            depender de cookies se resuelven con <strong>almacenamiento local</strong>, que no se
            envía al servidor.
          </p>

          <h2>3. Qué usa este sitio exactamente</h2>

          <h3>Almacenamiento propio (siempre activo)</h3>
          <div className="overflow-x-auto my-6">
            <table className="min-w-full text-sm text-left border-collapse border border-zinc-200 dark:border-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className={CELDA}>Nombre</th>
                  <th className={CELDA}>Tipo</th>
                  <th className={CELDA}>Para qué</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={CELDA}><code>theme</code></td>
                  <td className={CELDA}>Almacenamiento local</td>
                  <td className={CELDA}>Recordar si prefiere el modo claro u oscuro.</td>
                </tr>
                <tr>
                  <td className={CELDA}><code>eme-cookie-consent-v1</code></td>
                  <td className={CELDA}>Almacenamiento local</td>
                  <td className={CELDA}>Recordar su decisión sobre cookies para no volver a preguntarle.</td>
                </tr>
                <tr>
                  <td className={CELDA}><code>session</code></td>
                  <td className={CELDA}>Cookie de sesión</td>
                  <td className={CELDA}>Solo para el panel de administración. No la ve ningún visitante.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Estas tres son estrictamente necesarias para que el sitio funcione o para respetar su
            decisión, así que no requieren consentimiento.
          </p>

          <h3>Medición de audiencia (siempre activa, sin cookies)</h3>
          <p>
            Usamos <strong>Vercel Analytics</strong> y <strong>Vercel Speed Insights</strong>.{" "}
            <strong>No instalan cookies ni identifican a personas</strong>: agrupan las visitas con
            un identificador anónimo derivado de la petición, que cambia cada día y no permite
            seguirle entre sitios. Por eso funcionan sin pedirle permiso.
          </p>

          <h3>Publicidad y terceros (solo con su consentimiento)</h3>
          <div className="overflow-x-auto my-6">
            <table className="min-w-full text-sm text-left border-collapse border border-zinc-200 dark:border-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className={CELDA}>Proveedor</th>
                  <th className={CELDA}>Para qué</th>
                  <th className={CELDA}>Cuándo se carga</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={CELDA}><strong>Google AdSense</strong></td>
                  <td className={CELDA}>
                    Mostrar anuncios y, si procede, personalizarlos según su navegación. Instala
                    cookies publicitarias propias y de terceros (entre otras, <code>__gads</code>,{" "}
                    <code>IDE</code>).
                  </td>
                  <td className={CELDA}><strong>Solo si pulsa «Aceptar todas»</strong></td>
                </tr>
                <tr>
                  <td className={CELDA}><strong>A-ADS</strong></td>
                  <td className={CELDA}>
                    Mostrar un espacio publicitario lateral. Su proveedor declara no usar cookies de
                    seguimiento.
                  </td>
                  <td className={CELDA}><strong>Solo si pulsa «Aceptar todas»</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>Qué pasa si rechaza:</strong> los anuncios de Google y el espacio de A-ADS no se
            cargan en absoluto. Seguirá viendo la web completa; únicamente no verá esos bloques
            publicitarios. No se realiza ningún perfilado sobre usted.
          </p>

          <h2>4. Gestionarlas desde el navegador</h2>
          <p>
            Además del aviso de este sitio, puede bloquear o borrar el almacenamiento desde la
            configuración de su navegador:
          </p>
          <ul>
            <li><strong>Google Chrome:</strong> <a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
            <li><strong>Mozilla Firefox:</strong> <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
            <li><strong>Safari:</strong> <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
            <li><strong>Microsoft Edge:</strong> <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Configuración de cookies</a></li>
          </ul>

          <h2>5. Base legal</h2>
          <p>
            El uso de almacenamiento no esencial requiere su consentimiento previo, conforme al
            artículo 22.2 de la Ley 34/2002 (LSSI) y a las directrices de la Agencia Española de
            Protección de Datos. El almacenamiento estrictamente necesario está exento. Puede
            consultar cómo tratamos sus datos personales en la{" "}
            <a href="/politica-privacidad">Política de Privacidad</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
