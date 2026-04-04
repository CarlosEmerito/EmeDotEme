interface WebSiteSchemaProps {
  siteUrl: string;
  siteName: string;
  siteDescription: string;
}

export function WebSiteSchema({ siteUrl, siteName, siteDescription }: WebSiteSchemaProps) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "name": siteName,
    "description": siteDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/android-chrome-512x512.svg`,
        "width": 512,
        "height": 512,
      }
    },
    "inLanguage": "es-ES",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema, null, 2) }}
    />
  );
}