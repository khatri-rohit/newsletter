/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { formatTimestamp, sanitizeSearchQuery } from "@/lib/helpers";
import { Newsletter } from "@/services/types";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface HomeClientProps {
    initialNewsletters: Newsletter[];
}

export function HomeClient({ initialNewsletters }: HomeClientProps) {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    // Use custom debounce hook for better performance
    const debouncedQuery = useDebounce(sanitizeSearchQuery(searchQuery), 300);

    // Filter newsletters based on search query
    const newsletters = useMemo(() => {
        if (!debouncedQuery.trim()) return initialNewsletters;
        if (!initialNewsletters) return [];

        const query = debouncedQuery.toLowerCase();
        return initialNewsletters.filter((newsletter) =>
            newsletter.title.toLowerCase().includes(query) ||
            newsletter.excerpt?.toLowerCase().includes(query) ||
            newsletter.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }, [initialNewsletters, debouncedQuery]);

    const formatDate = (timestamp: unknown): string => {
        return formatTimestamp(timestamp, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleNewsletterClick = useCallback((slug: string) => {
        router.push(`/p/${slug}`);
    }, [router]);

    return (
        <div className="relative py-16 md:py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header with Search */}
                    <div className="mb-12 space-y-6">
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                Latest Newsletters
                            </h2>
                            <p className="text-base text-slate-600 max-w-2xl mx-auto">
                                {/* {initialNewsletters?.length || 0} articles • Updated Daily */}
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by title, content, or tags..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 pr-12 h-12 text-base bg-white border border-slate-300 focus:border-slate-400 focus:ring! focus:ring-slate-200 rounded-lg outline-none!"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {searchQuery && newsletters && (
                                <p className="mt-3 text-sm text-slate-600">
                                    {newsletters.length > 0
                                        ? `Showing ${newsletters.length} of ${initialNewsletters?.length || 0} newsletters`
                                        : 'No matches found'}
                                </p>
                            )}
                        </div>
                    </div>

                    {!newsletters || newsletters.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="max-w-md mx-auto">
                                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                    {searchQuery ? 'No results found' : 'No newsletters available'}
                                </h3>
                                <p className="text-sm text-slate-600 mb-6">
                                    {searchQuery
                                        ? 'Try different keywords or clear your search to see all newsletters'
                                        : 'New content is published regularly. Check back soon!'}
                                </p>
                                {searchQuery && (
                                    <Button
                                        onClick={() => setSearchQuery("")}
                                        variant="outline"
                                    >
                                        Show all newsletters
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Newsletter Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {newsletters.map((newsletter) => (
                                    <article
                                        key={newsletter.id}
                                        onClick={() => handleNewsletterClick(newsletter.slug)}
                                        className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
                                    >
                                        {/* Thumbnail */}
                                        {newsletter.thumbnail && (
                                            <div className="w-full h-48 bg-slate-100 overflow-hidden">
                                                <img
                                                    src={newsletter.thumbnail}
                                                    alt={newsletter.title}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="p-5 space-y-3">
                                            {/* Title */}
                                            <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug">
                                                {newsletter.title}
                                            </h3>

                                            {/* Metadata */}
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <time className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(newsletter.publishedAt || newsletter.createdAt)}
                                                </time>
                                                {newsletter.metadata?.readTime && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {newsletter.metadata.readTime} min
                                                    </span>
                                                )}
                                            </div>

                                            {/* Excerpt */}
                                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                {newsletter.excerpt || 'Read the full newsletter for more insights...'}
                                            </p>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-2 text-xs">
                                                <span className="text-slate-400">
                                                    {isAdmin && newsletter.views ? `${newsletter.views} views` : ' '}
                                                </span>
                                                <span className="font-medium text-slate-900 group-hover:text-blue-600">
                                                    Read article →
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
