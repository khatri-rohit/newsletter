import { Newsletter } from '@/services/types';

export function generateArticleSchema(newsletter: Newsletter, baseUrl: string) {
  const publishedDate = newsletter.publishedAt
    ? new Date(
        typeof newsletter.publishedAt === 'object' && '_seconds' in newsletter.publishedAt
          ? (newsletter.publishedAt._seconds as number) * 1000
          : (newsletter.publishedAt as string)
      ).toISOString()
    : new Date().toISOString();

  const modifiedDate = newsletter.updatedAt
    ? new Date(
        typeof newsletter.updatedAt === 'object' && '_seconds' in newsletter.updatedAt
          ? (newsletter.updatedAt._seconds as number) * 1000
          : (newsletter.updatedAt as string)
      ).toISOString()
    : publishedDate;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: newsletter.title,
    description: newsletter.excerpt || newsletter.title,
    image: newsletter.thumbnail || `${baseUrl}/og-image.png`,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Organization',
      name: 'Low Noise',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Low Noise',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/lownoise.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/p/${newsletter.slug}`,
    },
    keywords: newsletter.tags?.join(', ') || 'AI news, artificial intelligence',
  };
}

export function generateWebsiteSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Low Noise',
    alternateName: 'Low Noise - AI News, Simplified',
    url: baseUrl,
    description: 'Need-to-know AI news, minus the fluff—served bite-size, every day.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateOrganizationSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Low Noise',
    url: baseUrl,
    logo: `${baseUrl}/lownoise.png`,
    sameAs: [
      // Add your social media profiles here
      'https://twitter.com/lownoise',
    ],
    description: 'Curated AI news and insights delivered daily.',
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  baseUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}
