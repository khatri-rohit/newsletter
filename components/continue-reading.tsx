/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Clock, Eye } from 'lucide-react';
import { Newsletter } from '@/services/types';
import { formatTimestamp, formatNumber } from '@/lib/helpers';

interface ContinueReadingProps {
    currentNewsletterId: string;
}

export function ContinueReading({ currentNewsletterId }: ContinueReadingProps) {
    const router = useRouter();
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTopNewsletters = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/newsletters/top?limit=3&excludeId=${currentNewsletterId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch newsletters');
                }

                const result = await response.json();

                if (result.success && result.data) {
                    setNewsletters(result.data);
                } else {
                    throw new Error(result.error || 'Failed to fetch newsletters');
                }
            } catch (err) {
                console.error('Error fetching top newsletters:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchTopNewsletters();
    }, [currentNewsletterId]);

    const handleNewsletterClick = (slug: string) => {
        router.push(`/p/${slug}`);
    };

    const formatDate = (timestamp: unknown): string => {
        return formatTimestamp(timestamp, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6 font-newsreader">Continue Reading</h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-6 space-y-4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                            <div className="flex items-center justify-between pt-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-8 w-20" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error || newsletters.length === 0) {
        return null; // Don't show the section if there's an error or no newsletters
    }

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-newsreader">Continue Reading</h2>
                <Badge variant="secondary" className="text-xs">
                    Popular Articles
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {newsletters.map((newsletter) => (
                    <Card
                        key={newsletter.id}
                        className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                        onClick={() => handleNewsletterClick(newsletter.slug)}
                    >
                        <div className="p-6 space-y-4">
                            {/* Title */}
                            <h3 className="font-semibold text-lg line-clamp-2 transition-colors">
                                {newsletter.title}
                            </h3>

                            {/* Excerpt */}
                            {newsletter.excerpt && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {newsletter.excerpt}
                                </p>
                            )}

                            {/* Thumbnail */}
                            {newsletter.thumbnail && (
                                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={newsletter.thumbnail}
                                        alt={newsletter.title}
                                        className="object-cover transition-transform duration-200"
                                    />
                                </div>
                            )}

                            <Separator />

                            {/* Meta Information */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {newsletter.metadata?.readTime || 5} min
                                    </span>
                                    {/* <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {formatNumber(newsletter.views || 0)}
                                    </span> */}
                                </div>
                                <span>{formatDate(newsletter.publishedAt || newsletter.createdAt)}</span>
                            </div>

                            {/* Read More Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNewsletterClick(newsletter.slug);
                                }}
                            >
                                Read More
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}