import { MetadataRoute } from 'next';
import { NewsletterService } from '@/services/newsletter.service';
import { Newsletter } from '@/services/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const newsletterService = new NewsletterService();
    const { newsletters } = await newsletterService.listNewsletters({
      status: 'published',
      limit: 1000,
    });

    const newsletterEntries: MetadataRoute.Sitemap = newsletters.map((newsletter: Newsletter) => {
      const publishedDate = newsletter.publishedAt
        ? new Date(
            typeof newsletter.publishedAt === 'object' && '_seconds' in newsletter.publishedAt
              ? (newsletter.publishedAt._seconds as number) * 1000
              : (newsletter.publishedAt as string)
          )
        : new Date();

      return {
        url: `${baseUrl}/p/${newsletter.slug}`,
        lastModified: publishedDate,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      };
    });

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      ...newsletterEntries,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return basic sitemap if newsletter fetch fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
