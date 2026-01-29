/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Newsletter } from '@/services/types';
import { NewsletterContent } from './newsletter-content';
import { NewsletterService } from '@/services/newsletter.service';

// Helper function to serialize Firestore Timestamps to plain objects
function serializeNewsletter(newsletter: Newsletter): Newsletter {
    const serializeTimestamp = (timestamp: any): string | undefined => {
        if (!timestamp) return undefined;
        if (timestamp instanceof Date) return timestamp.toISOString();
        if (typeof timestamp === 'object' && '_seconds' in timestamp) {
            return new Date(timestamp._seconds * 1000).toISOString();
        }
        if (typeof timestamp === 'object' && 'seconds' in timestamp) {
            return new Date(timestamp.seconds * 1000).toISOString();
        }
        if (typeof timestamp === 'object' && 'toDate' in timestamp) {
            return timestamp.toDate().toISOString();
        }
        return timestamp;
    };

    return {
        ...newsletter,
        createdAt: serializeTimestamp(newsletter.createdAt) as any,
        updatedAt: serializeTimestamp(newsletter.updatedAt) as any,
        publishedAt: serializeTimestamp(newsletter.publishedAt) as any,
        scheduledFor: serializeTimestamp(newsletter.scheduledFor) as any,
    };
}

// Server-side data fetching - Direct service call (no HTTP)
async function getNewsletter(slug: string): Promise<Newsletter | null> {
    try {
        console.log('[getNewsletter] Fetching newsletter with slug:', slug);

        const newsletterService = new NewsletterService();
        const newsletter = await newsletterService.getNewsletterBySlug(slug);

        // console.log('[getNewsletter] Newsletter found:', newsletter ? {
        //     id: newsletter.id,
        //     title: newsletter.title,
        //     status: newsletter.status
        // } : 'null');

        // Only return published newsletters
        if (newsletter && newsletter.status === 'published') {
            return newsletter;
        }

        return null;
    } catch (error) {
        console.error('[getNewsletter] Error fetching newsletter:', {
            slug,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        // Re-throw to trigger error boundary
        throw error;
    }
}

// Generate metadata for SEO
export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    try {
        const { slug } = await params;
        const newsletter = await getNewsletter(slug);

        if (!newsletter) {
            return {
                title: 'Newsletter Not Found',
            };
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const pageUrl = `${baseUrl}/p/${slug}`;
        const imageUrl = newsletter.thumbnail || `${baseUrl}/og-image.png`;

        return {
            title: `${newsletter.title} | Low Noise`,
            description: newsletter.excerpt || newsletter.title,
            alternates: {
                canonical: pageUrl,
            },
            openGraph: {
                title: newsletter.title,
                description: newsletter.excerpt || newsletter.title,
                url: pageUrl,
                siteName: 'Low Noise',
                images: [{
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: newsletter.title,
                }],
                type: 'article',
                publishedTime: newsletter.publishedAt
                    ? new Date(
                        typeof newsletter.publishedAt === 'object' && '_seconds' in newsletter.publishedAt
                            ? (newsletter.publishedAt._seconds as any) * 1000
                            : newsletter.publishedAt as any
                    ).toISOString()
                    : undefined,
                authors: ['Low Noise Team'],
                tags: newsletter.tags || [],
            },
            twitter: {
                card: 'summary_large_image',
                site: '@lownoise',
                creator: '@lownoise',
                title: newsletter.title,
                description: newsletter.excerpt || newsletter.title,
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error('[generateMetadata] Error:', error);
        return {
            title: 'Error Loading Newsletter',
        };
    }
}

export default async function NewsletterPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;

    console.log('[NewsletterPage] Fetching newsletter with slug:', slug);

    const newsletter = await getNewsletter(slug);

    if (!newsletter) {
        console.log('[NewsletterPage] Newsletter not found or not published:', slug);
        notFound();
    }

    console.log('[NewsletterPage] Newsletter found:', newsletter.id, newsletter.title);

    // Serialize the newsletter data to remove Firestore Timestamp objects
    const serializedNewsletter = serializeNewsletter(newsletter);

    return <NewsletterContent newsletter={serializedNewsletter} />;
}
