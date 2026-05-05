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
          <p>Última actualización: {new Date().toLocaleDateString()}</p>
          
          <p>En <strong>{siteConfig.name}</strong>, accesible desde {siteConfig.url}, una de nuestras principales prioridades es la privacidad de nuestros visitantes. Este documento de Política de Privacidad contiene tipos de información que son recopilados y registrados por {siteConfig.name} y cómo la utilizamos.</p>

          <h2>1. Información que recopilamos</h2>
          <p>Si te suscribes a nuestra newsletter, te solicitamos tu dirección de correo electrónico. No recopilamos información personal adicional a menos que te pongas en contacto con nosotros directamente.</p>

          <h2>2. Cómo utilizamos tu información</h2>
          <p>Utilizamos la información que recopilamos de diversas maneras, incluyendo:</p>
          <ul>
            <li>Proporcionar, operar y mantener nuestro sitio web.</li>
            <li>Mejorar, personalizar y expandir nuestro sitio web.</li>
            <li>Comprender y analizar cómo utilizas nuestro sitio web.</li>
            <li>Desarrollar nuevos productos, servicios, características y funcionalidades.</li>
            <li>Comunicarnos contigo, ya sea directamente o a través de uno de nuestros socios, para proporcionarte actualizaciones y otra información relacionada con el sitio web, y con fines de marketing y promoción.</li>
            <li>Enviarte correos electrónicos.</li>
            <li>Encontrar y prevenir el fraude.</li>
          </ul>

          <h2>3. Cookies y balizas web</h2>
          <p>Al igual que cualquier otro sitio web, {siteConfig.name} utiliza 'cookies'. Estas cookies se utilizan para almacenar información, incluyendo las preferencias de los visitantes y las páginas del sitio web a las que el visitante accedió o visitó. La información se utiliza para optimizar la experiencia de los usuarios personalizando el contenido de nuestra página web en función del tipo de navegador de los visitantes y/u otra información.</p>

          <h2>4. Google DoubleClick DART Cookie</h2>
          <p>Google es uno de los proveedores de terceros en nuestro sitio. También utiliza cookies, conocidas como cookies de DART, para servir anuncios a los visitantes de nuestro sitio basados en su visita a www.website.com y otros sitios en el internet.</p>

          <h2>5. Nuestros socios publicitarios</h2>
          <p>Algunos de los anunciantes en nuestro sitio pueden utilizar cookies y balizas web. Nuestros socios publicitarios incluyen:</p>
          <ul>
            <li>Google AdSense</li>
          </ul>

          <h2>6. Derechos de protección de datos (GDPR)</h2>
          <p>Nos gustaría asegurarnos de que eres plenamente consciente de todos tus derechos de protección de datos. Todo usuario tiene derecho a lo siguiente:</p>
          <ul>
            <li><strong>Derecho de acceso:</strong> Tienes derecho a solicitar copias de tus datos personales.</li>
            <li><strong>Derecho de rectificación:</strong> Tienes derecho a solicitar que corrijamos cualquier información que creas que es inexacta.</li>
            <li><strong>Derecho de supresión:</strong> Tienes derecho a solicitar que eliminemos tus datos personales, bajo ciertas condiciones.</li>
          </ul>

          <p>Si tienes preguntas adicionales o necesitas más información sobre nuestra Política de Privacidad, no dudes en contactarnos a través de {siteConfig.links.email}.</p>
        </div>
      </main>
    </div>
  );
}
