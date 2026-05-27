interface ArticleSchemaProps {
  article: any; // Using any to avoid type complexity with includes
  siteUrl: string;
}

export function ArticleSchema({ article, siteUrl }: ArticleSchemaProps) {
  const articleUrl = `${siteUrl}/articulo/${article.slug}`;
  const imageUrl = article.imageUrl || `${siteUrl}/og.jpg`;

  const keywords = article.articleTags 
    ? article.articleTags.map((t: any) => t.name).join(", ") 
    : "";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.summary || article.content.substring(0, 200),
    "image": imageUrl,
    "datePublished": article.createdAt,
    "dateModified": article.updatedAt,
    "author": {
      "@type": "Person",
      "name": article.author,
      "url": `${siteUrl}/sobre-mi`,
    },
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
    "articleSection": article.category?.name || "Tecnología",
    "keywords": keywords,
    "wordCount": article.content.split(/\s+/).length,
    "inLanguage": "es-ES",
    "potentialAction": {
      "@type": "ReadAction",
      "target": [articleUrl]
    }
  };

  const schemas: any[] = [articleSchema];

  // Add FAQ schema if present
  if (article.faqs && Array.isArray(article.faqs) && article.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": (article.faqs as any[]).map(faq => ({
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.length === 1 ? schemas[0] : schemas, null, 2) }}
    />
  );
}