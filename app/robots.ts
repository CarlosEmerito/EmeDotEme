import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /preview/ es el enlace privado de revisión: nunca debe indexarse.
      disallow: ['/admin/', '/api/', '/preview/'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
