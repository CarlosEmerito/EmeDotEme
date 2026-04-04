import { Article } from "@prisma/client";
import { Category } from "@prisma/client";

interface ArticleSchemaProps {
  article: Article & { category: Category };
  siteUrl: string;
}

export function ArticleSchema({ article, siteUrl }: ArticleSchemaProps) {
  const articleUrl = `${siteUrl}/articulo/${article.slug}`;
  const imageUrl = article.imageUrl || `${siteUrl}/og.jpg`;

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
    "articleSection": article.category.name,
    "keywords": article.tags.join(", "),
    "wordCount": article.content.split(/\s+/).length,
    "inLanguage": "es-ES",
    "potentialAction": {
      "@type": "ReadAction",
      "target": [articleUrl]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema, null, 2) }}
    />
  );
}