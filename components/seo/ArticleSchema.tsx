/* eslint-disable @typescript-eslint/no-explicit-any */
import { safeJsonLdString } from "@/lib/sanitize-html";

/**
 * Datos estructurados (JSON-LD) del artículo.
 *
 * **Fuente única.** Antes había dos bloques `NewsArticle` en la misma página
 * —uno escrito a mano en la página y otro generado aquí— y por eso uno de ellos
 * seguía declarando la autoría como `Person` con enlace a «Sobre mí» después de
 * corregir el otro. Si necesitas tocar los datos estructurados, se tocan aquí.
 *
 * **La autoría es la del responsable editorial.** El artículo se aprueba de
 * forma individual antes de publicarse y la responsabilidad editorial es de
 * quien figura en «Sobre mí» y en la política editorial, que es a donde apunta
 * el enlace de autoría.
 *
 * @param lang Idioma de la página. Determina los campos que se emiten (ES/EN) y
 *   las URLs a las que se enlaza.
 */
interface ArticleSchemaProps {
  article: any; // Using any to avoid type complexity with includes
  siteUrl: string;
  lang?: "es" | "en";
}

export function ArticleSchema({ article, siteUrl, lang = "es" }: ArticleSchemaProps) {
  const es = lang === "es";

  const articleUrl = `${siteUrl}${es ? "/articulo" : "/en/article"}/${article.slug}`;
  const imageUrl = article.imageUrl || `${siteUrl}/og.jpg`;

  const title = (es ? article.title : article.titleEn || article.title) || "";
  const summary = (es ? article.summary : article.summaryEn || article.summary) || "";
  const content = (es ? article.content : article.contentEn || article.content) || "";

  const keywords = article.articleTags
    ? article.articleTags.map((t: any) => t.name).join(", ")
    : "";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": summary || content.substring(0, 200),
    "image": imageUrl ? [imageUrl] : undefined,
    "datePublished": article.createdAt,
    "dateModified": article.updatedAt,
    "author": [{
      "@type": "Person",
      "name": article.author,
      "url": `${siteUrl}${es ? "/sobre-mi" : "/en/about-me"}`,
    }],
    "publisher": {
      "@type": "Organization",
      "name": "EmeDotEme",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/android-chrome-512x512.svg`,
        "width": 512,
        "height": 512,
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    "articleSection": article.category?.name || (es ? "Tecnología" : "Technology"),
    "keywords": keywords,
    "wordCount": content.split(/\s+/).length,
    "inLanguage": es ? "es-ES" : "en-US",
    "isAccessibleForFree": true,
    "potentialAction": {
      "@type": "ReadAction",
      "target": [articleUrl]
    }
  };

  const schemas: any[] = [articleSchema];

  // Add FAQ schema if present
  const faqs = es ? article.faqs : article.faqsEn || article.faqs;
  if (faqs && Array.isArray(faqs) && faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": (faqs as any[]).map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdString(schemas.length === 1 ? schemas[0] : schemas) }}
    />
  );
}
