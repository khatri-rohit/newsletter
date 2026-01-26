/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Newsletter } from '@/services/types';
import { NewsletterContent } from './newsletter-content';
import { NewsletterService } from '@/services/newsletter.service';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin for server-side
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

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
    const { slug } = await params;
    const newsletter = await getNewsletter(slug);

    if (!newsletter || newsletter.status !== 'published') {
        notFound();
    }

    return <NewsletterContent newsletter={newsletter} />;
}
