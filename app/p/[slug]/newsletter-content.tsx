/* eslint-disable @next/next/no-img-element */
'use client';

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

interface NewsletterContentProps {
    newsletter: Newsletter;
}

export function NewsletterContent({ newsletter }: NewsletterContentProps) {
    const router = useRouter();
    const { isAdmin } = useAuth();

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: newsletter?.title,
                    text: newsletter?.excerpt,
                    url: url,
                });
            } catch (err) {
                console.error('Error sharing:', err);
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
        if (!timestamp) return '';
        let date: Date;

        if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
            date = (timestamp as { toDate: () => Date }).toDate();
        } else if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp) {
            date = new Date((timestamp as { _seconds: number })._seconds * 1000);
        } else {
            return '';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header classname="max-w-5xl" />

            <main className="px-2 md:px-1 flex-1 container mx-auto py-8 pt-20 max-w-5xl">
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
                                    {isAdmin && newsletter.views !== undefined && (
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="h-4 w-4" aria-hidden="true" />
                                            {(newsletter.views || 0).toLocaleString()} views
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
                            {isAdmin && newsletter.views !== undefined && (
                                <div className="flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    <span className="text-gray-600">
                                        {(newsletter.views || 0).toLocaleString()} views
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
