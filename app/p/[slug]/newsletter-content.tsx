/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Eye, Share2 } from 'lucide-react';
import { Newsletter } from '@/services/types';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import ScrollTop from '@/components/scroll-to-top';
import { formatTimestamp, generateViewerId, formatNumber } from '@/lib/helpers';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/schema';

interface NewsletterContentProps {
    newsletter: Newsletter;
}

export function NewsletterContent({ newsletter }: NewsletterContentProps) {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const [viewCount, setViewCount] = useState(newsletter.views || 0);
    const [isTracking, setIsTracking] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const articleSchema = generateArticleSchema(newsletter, baseUrl);
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: newsletter.title, url: `/p/${newsletter.slug}` },
    ], baseUrl);

    // Track newsletter view
    useEffect(() => {
        const trackView = async () => {
            if (isTracking) return; // Prevent duplicate tracking
            setIsTracking(true);

            try {
                const viewerId = generateViewerId();

                // Call the API to increment views
                const response = await fetch(`/api/newsletters/${newsletter.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'incrementViews',
                        viewerId,
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.data?.counted && result.data?.totalViews) {
                        setViewCount(result.data.totalViews);
                    }
                }
            } catch (error) {
                console.error('Error tracking view:', error);
            }
        };

        // Track view after a 3-second delay to ensure it's a genuine read
        const timer = setTimeout(trackView, 3000);
        return () => clearTimeout(timer);
    }, [newsletter.id, isTracking]);

    // Track scroll progress
    useEffect(() => {
        const updateScrollProgress = () => {
            const article = document.querySelector('article');
            if (!article) return;

            const articleRect = article.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate how much of the article is visible
            const articleHeight = articleRect.height;

            // End tracking when article bottom reaches viewport top
            const endTrackingPoint = articleHeight - windowHeight;

            if (endTrackingPoint <= 0) {
                // Article is smaller than viewport, show 100% progress
                setScrollProgress(100);
                return;
            }

            const scrollY = window.scrollY;
            const articleStart = article.offsetTop;
            const articleEnd = articleStart + endTrackingPoint;

            if (scrollY < articleStart) {
                setScrollProgress(0);
            } else if (scrollY >= articleEnd) {
                setScrollProgress(100);
            } else {
                const progress = ((scrollY - articleStart) / endTrackingPoint) * 100;
                setScrollProgress(Math.min(100, Math.max(0, progress)));
            }
        };

        // Throttle scroll events for better performance
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateScrollProgress();
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Initial calculation
        updateScrollProgress();

        // Add scroll listener
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Update on window resize
        window.addEventListener('resize', updateScrollProgress, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateScrollProgress);
        };
    }, []);

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: newsletter?.title,
                    text: newsletter?.excerpt,
                    url: url,
                });
                toast.success('Shared successfully!');
            } catch (err) {
                // User cancelled or error occurred
                if ((err as Error).name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            } catch {
                toast.error('Failed to copy link');
            }
        }
    };

    const formatDate = (timestamp: unknown): string => {
        return formatTimestamp(timestamp, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="flex flex-col bg-slate-50">
            {/* Scroll Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-2 bg-gray-200">
                <div
                    className={`h-full bg-black transition-all duration-150 ease-out ${scrollProgress !== 100 && 'rounded-r-full'}`}
                    style={{ width: `${scrollProgress}%` }}
                    aria-hidden="true"
                />
            </div>

            <ScrollTop />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <Header classname="max-w-5xl" />

            <main className="min-h-screen px-2 md:px-1 flex-1 container mx-auto py-8 pt-20 max-w-5xl">
                {/* Breadcrumb Navigation */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button
                                    onClick={() => router.push('/')}
                                    className="hover:text-muted-foreground text-muted-foreground cursor-pointer"
                                    aria-label="Go to home"
                                >
                                    Home
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button
                                    className="hover:text-muted-foreground text-muted-foreground"
                                    aria-label="Posts"
                                >
                                    Posts
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="max-w-75 truncate">
                                {newsletter?.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Article Container */}
                <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Thumbnail */}
                    {newsletter.thumbnail && (
                        <div className="w-full h-full relative overflow-hidden">
                            <img
                                src={newsletter.thumbnail}
                                alt={newsletter.title}
                                className="w-full h-full object-cover"
                                loading="eager"
                                fetchPriority="high"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-4 sm:p-8 md:p-12">
                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 font-newsreader leading-tight text-slate-900">
                            {newsletter.title}
                        </h1>

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" aria-hidden="true" />
                                <time dateTime={formatDate(newsletter.publishedAt || newsletter.createdAt)}>
                                    {formatDate(newsletter.publishedAt || newsletter.createdAt)}
                                </time>
                            </span>
                            {newsletter.authorName && (
                                <span className="flex items-center gap-1.5">
                                    By {newsletter.authorName}
                                </span>
                            )}
                            {newsletter.metadata && (
                                <>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" aria-hidden="true" />
                                        {newsletter.metadata.readTime} min read
                                    </span>
                                    {isAdmin && viewCount > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="h-4 w-4" aria-hidden="true" />
                                            {formatNumber(viewCount)} views
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        <Separator className="my-6" />

                        {/* Excerpt */}
                        {newsletter.excerpt && (
                            <p className="text-lg sm:text-xl text-gray-700 italic mb-6 sm:mb-8 leading-relaxed">
                                {newsletter.excerpt}
                            </p>
                        )}

                        {/* Main Content */}
                        <div
                            className="newsletter-content prose md:prose-lg max-w-none prose-slate prose-headings:font-newsreader prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: newsletter.content }}
                        />

                        <Separator className="my-8" />

                        {/* Share Section */}
                        <div className="flex items-center justify-between">
                            {isAdmin && viewCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    <span className="text-gray-600">
                                        {formatNumber(viewCount)} views
                                    </span>
                                </div>
                            )}
                            <Button onClick={handleShare} variant="outline" aria-label="Share article">
                                <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                                Share
                            </Button>
                        </div>
                    </div>
                </article>

                {/* Author Bio */}
                {/* {newsletter.authorName && (
                    <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-bold mb-2">About the Author</h3>
                        <p className="text-gray-600">
                            {newsletter.authorName} • {newsletter.authorEmail}
                        </p>
                    </div>
                )} */}
            </main>

            <Footer classname="max-w-5xl" />
        </div>
    );
}
