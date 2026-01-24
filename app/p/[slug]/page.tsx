/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { LoadingScreen } from '@/components/loading-screen';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Eye, ArrowLeft, Share2 } from 'lucide-react';
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

export default function NewsletterPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { isAdmin } = useAuth();

    const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const fetchNewsletter = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/newsletters/slug/${slug}`);
                const data = await response.json();

                if (data.success) {
                    setNewsletter(data.data);
                } else {
                    setError(data.error || 'Newsletter not found');
                }
            } catch (err) {
                console.error('Error fetching newsletter:', err);
                setError('Failed to load newsletter');
            } finally {
                setLoading(false);
            }
        };

        fetchNewsletter();
    }, [slug]);

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
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
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

    if (loading) {
        return <LoadingScreen />;
    }

    if (error || !newsletter) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8 pt-20 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold">Newsletter Not Found</h1>
                        <p className="text-gray-600">
                            {error || 'The newsletter you are looking for does not exist.'}
                        </p>
                        <Button onClick={() => router.push('/')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 pt-20 max-w-5xl">
                {/* Back Button */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button
                                    onClick={() => router.push('/')}
                                    className="hover:text-muted-foreground text-muted-foreground cursor-pointer"
                                >
                                    Home
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button
                                    className="hover:text-muted-foreground text-muted-foreground "
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
                <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Thumbnail */}
                    {newsletter.thumbnail && (
                        <div className="w-full h-100 relative overflow-hidden">
                            <img
                                src={newsletter.thumbnail}
                                alt={newsletter.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-8 md:p-12">
                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-newsreader leading-tight text-slate-900">
                            {newsletter.title}
                        </h1>

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {formatDate(newsletter.publishedAt || newsletter.createdAt)}
                            </span>
                            {newsletter.authorName && (
                                <span className="flex items-center gap-1.5">
                                    By {newsletter.authorName}
                                </span>
                            )}
                            {newsletter.metadata && (
                                <>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        {newsletter.metadata.readTime} min read
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Eye className="h-4 w-4" />
                                        {(newsletter.views || 0).toLocaleString()} views
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Tags */}
                        {newsletter.tags && newsletter.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {newsletter.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Separator className="my-6" />

                        {/* Excerpt */}
                        {newsletter.excerpt && (
                            <p className="text-xl text-gray-700 italic mb-8 leading-relaxed">
                                {newsletter.excerpt}
                            </p>
                        )}

                        {/* Main Content */}
                        <div
                            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-slate-900 prose-img:rounded-lg prose-img:shadow-lg"
                            dangerouslySetInnerHTML={{ __html: newsletter.content }}
                        />

                        <Separator className="my-8" />

                        {/* Share Section */}
                        <div className="flex items-center justify-between">
                            {isAdmin && newsletter.views !== undefined && (
                                <div className="flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-gray-400" />
                                    <span className="text-gray-600">
                                        {(newsletter.views || 0).toLocaleString()} views
                                    </span>
                                </div>
                            )}
                            <Button onClick={handleShare} variant="outline">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>
                </article>

                {/* Author Bio (optional, can be expanded later) */}
                {newsletter.authorName && (
                    <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-bold mb-2">About the Author</h3>
                        <p className="text-gray-600">
                            {newsletter.authorName} • {newsletter.authorEmail}
                        </p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
