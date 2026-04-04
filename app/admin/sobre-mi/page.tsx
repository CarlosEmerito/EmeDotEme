import { prisma } from "@/lib/prisma";
import AboutMeForm from "./components/AboutMeForm";

export const metadata = { title: "Sobre Mí | Admin" };

export default async function SobreMiPage() {
  const setting = await prisma.setting.findUnique({
    where: { key: "sobre_mi_content" }
  });

  const defaultContent = `<p>
  Soy Carlos "Emérito" López Lovera, periodista financiero y analista de mercados especializado en criptomonedas, tecnología Web3 y macroeconomía global. Con años de experiencia cubriendo los mercados digitales, mi objetivo es desmitificar el ecosistema blockchain y proporcionar análisis claros y accionables.
</p>

<h2>Nuestra Misión en EmeDotEme</h2>
<p>
  Fundé EmeDotEme con una visión clara: entregar noticias financieras oportunas, libres de ruido y respaldadas por datos duros del mercado en tiempo real. En un ecosistema que se mueve 24/7, la velocidad y la precisión de la información son cruciales para tomar buenas decisiones.
</p>

<h2>Trayectoria</h2>
<p>
  A lo largo de mi carrera he colaborado en diversos proyectos editoriales, siempre buscando la intersección entre las finanzas tradicionales y la nueva frontera de las finanzas descentralizadas (DeFi). Creo firmemente que la adopción de las criptomonedas requiere educación de calidad y periodismo honesto.
</p>`;

  const content = setting?.value || defaultContent;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
          Página &quot;Sobre Mí&quot;
        </h1>
        <p className="text-zinc-500 mt-2">
          Edita el contenido que aparece en tu biografía pública.
        </p>
      </div>

      <AboutMeForm initialContent={content} />
    </div>
  );
}
