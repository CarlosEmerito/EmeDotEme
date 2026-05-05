import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Política de Privacidad | ${siteConfig.name}`,
  description: `Conoce cómo tratamos tus datos personales en ${siteConfig.name}.`,
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-4xl font-bold font-serif text-black dark:text-white mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <p>Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          
          <p>En <strong>{siteConfig.name}</strong>, valoramos la privacidad de nuestros usuarios y estamos comprometidos con la protección de sus datos personales. Esta Política de Privacidad describe cómo recopilamos, utilizamos y protegemos su información de acuerdo con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales (LOPDGDD).</p>

          <h2>1. Responsable del Tratamiento</h2>
          <p>El responsable del tratamiento de los datos personales recogidos a través de este sitio web es:</p>
          <ul>
            <li><strong>Identidad:</strong> {siteConfig.author}</li>
            <li><strong>Email:</strong> carlosemerito13@gmail.com</li>
            <li><strong>Actividad:</strong> Divulgación de noticias sobre tecnología, criptomonedas y mercados.</li>
          </ul>

          <h2>2. Finalidad del Tratamiento</h2>
          <p>Tratamos la información que nos facilitan las personas interesadas con las siguientes finalidades:</p>
          <ul>
            <li><strong>Gestión de suscripciones:</strong> Gestionar el envío de nuestra newsletter y comunicaciones comerciales a las que el usuario se haya suscrito.</li>
            <li><strong>Contacto y soporte:</strong> Atender las consultas, solicitudes o sugerencias enviadas a través de nuestro formulario de contacto.</li>
            <li><strong>Mejora de la experiencia:</strong> Analizar la navegación del usuario para optimizar la usabilidad y el contenido del sitio web.</li>
            <li><strong>Publicidad:</strong> Gestionar los espacios publicitarios en el sitio web de acuerdo con los intereses del usuario.</li>
          </ul>

          <h2>3. Base Legal para el Tratamiento</h2>
          <p>La base legal para el tratamiento de sus datos varía según la finalidad:</p>
          <ul>
            <li><strong>Consentimiento:</strong> Para la suscripción a la newsletter y el envío de consultas a través del formulario.</li>
            <li><strong>Interés legítimo:</strong> Para la realización de análisis estadísticos y mejora del sitio web.</li>
            <li><strong>Cumplimiento de obligaciones legales:</strong> En caso de que sea necesario para cumplir con la legislación vigente.</li>
          </ul>

          <h2>4. Conservación de los Datos</h2>
          <p>Los datos personales se conservarán mientras se mantenga la relación con el usuario o hasta que este solicite su supresión, y en cualquier caso, durante los plazos legales obligatorios.</p>

          <h2>5. Destinatarios de los Datos</h2>
          <p>No se cederán datos a terceros, salvo obligación legal o para la prestación de servicios necesarios para el funcionamiento del sitio web, tales como:</p>
          <ul>
            <li><strong>Proveedores de servicios de correo (Resend):</strong> Para el envío de la newsletter.</li>
            <li><strong>Google LLC (Analytics/AdSense):</strong> Para análisis de tráfico y gestión publicitaria (sujeto a las políticas de privacidad de Google).</li>
            <li><strong>Proveedores de Hosting (Vercel/Supabase):</strong> Para el alojamiento del sitio y la base de datos.</li>
          </ul>

          <h2>6. Transferencias Internacionales</h2>
          <p>Algunos de nuestros proveedores (como Google o Resend) pueden estar ubicados en países fuera del Espacio Económico Europeo. En tales casos, nos aseguramos de que existan garantías adecuadas, como cláusulas contractuales tipo o marcos de privacidad reconocidos.</p>

          <h2>7. Sus Derechos</h2>
          <p>Como interesado, usted tiene derecho a:</p>
          <ul>
            <li>Acceder a sus datos personales.</li>
            <li>Solicitar la rectificación de datos inexactos.</li>
            <li>Solicitar su supresión cuando ya no sean necesarios.</li>
            <li>Solicitar la limitación u oposición a su tratamiento.</li>
            <li>Solicitar la portabilidad de sus datos.</li>
          </ul>
          <p>Puede ejercer estos derechos enviando un correo electrónico a carlosemerito13@gmail.com, adjuntando una copia de su DNI o documento equivalente para verificar su identidad.</p>

          <p>Si considera que sus derechos no han sido debidamente atendidos, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).</p>
        </div>
      </main>
    </div>
  );
}
