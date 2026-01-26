/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Newsletter } from '@/services/types';
import { NewsletterContent } from './newsletter-content';
import { NewsletterService } from '@/services/newsletter.service';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// Ensure Firebase Admin is initialized
getFirebaseAdmin();

// Server-side data fetching - Direct service call (no HTTP)
async function getNewsletter(slug: string): Promise<Newsletter | null> {
    try {
        const newsletterService = new NewsletterService();
        const newsletter = await newsletterService.getNewsletterBySlug(slug);

        // Only return published newsletters
        if (newsletter && newsletter.status === 'published') {
            return newsletter;
        }

        return null;
    } catch (error) {
        console.error('Error fetching newsletter:', error);
        return null;
    }
}

// Generate metadata for SEO
export async function generateMetadata({
    params
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params;
    const newsletter = await getNewsletter(slug);

    if (!newsletter) {
        return {
            title: 'Newsletter Not Found',
        };
    }

    return {
        title: `${newsletter.title} | Low Noise`,
        description: newsletter.excerpt || newsletter.title,
        openGraph: {
            title: newsletter.title,
            description: newsletter.excerpt || newsletter.title,
            images: newsletter.thumbnail ? [newsletter.thumbnail] : [],
            type: 'article',
            publishedTime: newsletter.publishedAt
                ? new Date(
                    typeof newsletter.publishedAt === 'object' && '_seconds' in newsletter.publishedAt
                        ? (newsletter.publishedAt._seconds as any) * 1000
                        : newsletter.publishedAt as any
                ).toISOString()
                : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: newsletter.title,
            description: newsletter.excerpt || newsletter.title,
            images: newsletter.thumbnail ? [newsletter.thumbnail] : [],
        },
    };
}

export default async function NewsletterPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    try {
        const { slug } = await params;

        console.log('[NewsletterPage] Fetching newsletter with slug:', slug);

        const newsletter = await getNewsletter(slug);

        if (!newsletter) {
            console.log('[NewsletterPage] Newsletter not found:', slug);
            notFound();
        }

        if (newsletter.status !== 'published') {
            console.log('[NewsletterPage] Newsletter not published:', slug, newsletter.status);
            notFound();
        }

        console.log('[NewsletterPage] Newsletter found:', newsletter.id, newsletter.title);

        // eslint-disable-next-line react-hooks/error-boundaries
        return <NewsletterContent newsletter={newsletter} />;
    } catch (error) {
        console.error('[NewsletterPage] Error rendering newsletter:', error);
        throw error; // Re-throw to be caught by error boundary
    }
}
