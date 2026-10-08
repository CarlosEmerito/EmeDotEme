import { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Política de Privacidad | ${siteConfig.name}`,
  description: `Conoce cómo tratamos tus datos personales en ${siteConfig.name}.`,
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Política de Privacidad</h1>

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Última actualización: 8 de octubre de 2026</p>

          <p>En <strong>{siteConfig.name}</strong>, valoramos la privacidad de nuestros usuarios y estamos comprometidos con la protección de sus datos personales. Esta Política de Privacidad describe cómo recopilamos, utilizamos y protegemos su información de acuerdo con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales (LOPDGDD).</p>

          <h2>1. Responsable del Tratamiento</h2>
          <ul>
            <li><strong>Identidad:</strong> {siteConfig.author}</li>
            <li><strong>Email:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Actividad:</strong> Divulgación de noticias sobre tecnología, criptomonedas y mercados.</li>
          </ul>
          <p>Es también la persona a la que puede dirigirse para cualquier cuestión sobre esta política.</p>

          <h2>2. Qué datos tratamos y para qué</h2>
          <p>Solo se tratan datos personales en tres supuestos:</p>
          <ul>
            <li><strong>Suscripción a la newsletter:</strong> su dirección de correo electrónico y la fecha y hora de la suscripción, para enviarle el boletín y gestionar su baja.</li>
            <li><strong>Formulario de contacto:</strong> los datos que usted incluya en el mensaje, para atender su consulta.</li>
            <li><strong>Medición de audiencia:</strong> datos de navegación <strong>agregados y anónimos</strong> (páginas vistas, tiempo de visita, país aproximado), sin identificarle individualmente.</li>
          </ul>
          <p>
            <strong>No hacemos perfilado de usuarios</strong>, no elaboramos perfiles comerciales y no
            tratamos sus datos para tomar decisiones automatizadas que le afecten.
          </p>

          <h2>3. Base Legal</h2>
          <ul>
            <li><strong>Consentimiento</strong> (art. 6.1.a RGPD): para la suscripción a la newsletter, para el envío de consultas a través del formulario y para la carga de cookies de publicidad de terceros. Puede retirarlo en cualquier momento sin que ello afecte a la licitud del tratamiento previo.</li>
            <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): para la medición de audiencia agregada y anónima, la seguridad del sitio y la prevención de abusos.</li>
            <li><strong>Cumplimiento de obligaciones legales</strong> (art. 6.1.c RGPD): cuando resulte necesario para atender requerimientos legales.</li>
          </ul>

          <h2>4. Cuánto tiempo conservamos los datos</h2>
          <ul>
            <li><strong>Newsletter:</strong> mientras no solicite la baja. Al darse de baja, su dirección se suprime de la base de datos de envío.</li>
            <li><strong>Contacto:</strong> el tiempo necesario para atender la consulta y, después, un máximo de un año.</li>
            <li><strong>Medición de audiencia:</strong> los datos son agregados y no permiten identificarle.</li>
          </ul>

          <h2>5. Destinatarios y encargados del tratamiento</h2>
          <p>No se ceden datos a terceros salvo obligación legal. Sí utilizamos estos proveedores, que tratan datos por cuenta nuestra y con contrato de encargo:</p>
          <ul>
            <li><strong>Vercel Inc.:</strong> alojamiento del sitio web y medición de audiencia sin cookies.</li>
            <li><strong>Supabase Inc.:</strong> base de datos de artículos y almacenamiento de imágenes.</li>
            <li><strong>Resend:</strong> envío de la newsletter.</li>
            <li><strong>Cloudflare, Inc.:</strong> generación de imágenes de ilustración mediante inteligencia artificial.</li>
            <li><strong>Pixabay (Canva):</strong> búsqueda de fotografías con licencia de uso comercial.</li>
            <li><strong>Google LLC:</strong> solo si acepta las cookies publicitarias, para la gestión de los espacios de AdSense.</li>
          </ul>

          <h2>6. Transferencias Internacionales</h2>
          <p>Algunos de nuestros proveedores están ubicados fuera del Espacio Económico Europeo, principalmente en Estados Unidos. En tales casos, las transferencias se amparan en:</p>
          <ul>
            <li>El <strong>Marco de Privacidad de Datos UE-EE. UU.</strong> (EU-US Data Privacy Framework), para los proveedores certificados.</li>
            <li>Las <strong>cláusulas contractuales tipo</strong> aprobadas por la Comisión Europea, con evaluación de las medidas suplementarias aplicables.</li>
          </ul>
          <p>Puede solicitar información sobre las garantías aplicadas escribiendo a la dirección del apartado 1.</p>

          <h2>7. Sus Derechos</h2>
          <p>Como interesado, usted tiene derecho a:</p>
          <ul>
            <li>Acceder a sus datos personales.</li>
            <li>Solicitar la rectificación de datos inexactos.</li>
            <li>Solicitar su supresión cuando ya no sean necesarios.</li>
            <li>Solicitar la limitación u oposición a su tratamiento.</li>
            <li>Solicitar la portabilidad de sus datos.</li>
            <li>Retirar su consentimiento en cualquier momento.</li>
          </ul>
          <p>
            Puede ejercerlos enviando un correo a <strong>carlosemerito13@gmail.com</strong>. Para
            darse de baja de la newsletter basta con usar el enlace que aparece al pie de cada envío.
          </p>
          <p>
            Si considera que no hemos atendido correctamente sus derechos, puede presentar una
            reclamación ante la <strong>Agencia Española de Protección de Datos</strong> (AEPD),{" "}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
          </p>

          <h2>8. Menores de edad</h2>
          <p>
            Este sitio no está dirigido a menores de 14 años. La suscripción a la newsletter requiere
            declarar ser mayor de esa edad, y si detectamos una suscripción de un menor sin
            autorización de sus representantes, la eliminaremos.
          </p>

          <h2>9. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger los datos: cifrado en
            tránsito, control de acceso a la base de datos y limitación de los datos tratados a lo
            estrictamente necesario.
          </p>

          <p>
            Ver también: <Link href="/cookies">Política de Cookies</Link>,{" "}
            <Link href="/aviso-legal">Aviso Legal</Link> y{" "}
            <Link href="/politica-editorial">Política Editorial</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
