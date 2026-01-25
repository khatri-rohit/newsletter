/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Newsletter } from '@/services/types';
import { NewsletterContent } from './newsletter-content';

// Server-side data fetching
async function getNewsletter(slug: string): Promise<Newsletter | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/newsletters/slug/${slug}`, {
            cache: 'no-store', // For now, we'll optimize caching later
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.success ? data.data : null;
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
    const { slug } = await params;
    const newsletter = await getNewsletter(slug);

    if (!newsletter || newsletter.status !== 'published') {
        notFound();
    }

    return <NewsletterContent newsletter={newsletter} />;
}
