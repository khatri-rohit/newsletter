/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/footer";
import { Header } from "@/components/header";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { Input } from "@/components/ui/input";
import { Sparkles, Calendar, Clock, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useGetNewslettersQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatTimestamp, sanitizeSearchQuery } from "@/lib/helpers";

export default function Home() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Use RTK Query for automatic caching and refetching
  const { data, isLoading: loading } = useGetNewslettersQuery({
    status: 'published',
    limit: 20, // Increased for better search results
  });

  const allNewsletters = data?.data?.newsletters;

  // Debounce search input for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(sanitizeSearchQuery(searchQuery));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter newsletters based on search query
  const newsletters = useMemo(() => {
    if (!debouncedQuery.trim()) return allNewsletters;
    if (!allNewsletters) return [];

    const query = debouncedQuery.toLowerCase();
    return allNewsletters.filter((newsletter) =>
      newsletter.title.toLowerCase().includes(query) ||
      newsletter.excerpt?.toLowerCase().includes(query) ||
      newsletter.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [allNewsletters, debouncedQuery]);

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
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Hero Section */}
      <main className="relative overflow-hidden">

        <div className="container relative mx-auto px-3 sm:px-4 pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-28 md:pb-20">
          {/* Hero Content */}
          <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
            {/* Main Heading with animated gradient */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-blue-200 bg-white/50 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-blue-900">AI News, Simplified</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight px-2">
                Stay Ahead in AI
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
                Curated insights, breakthrough developments, and expert analysis delivered to your inbox every morning.
              </p>
            </div>

            {/* Newsletter Form with enhanced styling */}
            <div className="px-2 sm:px-0">
              <NewsletterSubscribe />
            </div>

            {/* Stats with icons */}
            {/* <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <div className="flex items-center gap-3 group cursor-default">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">Daily</div>
                  <div className="text-sm text-slate-600">7 AM Delivery</div>
                </div>
              </div>

              <div className="flex items-center gap-3 group cursor-default">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">10K+</div>
                  <div className="text-sm text-slate-600">Active Readers</div>
                </div>
              </div>

              <div className="flex items-center gap-3 group cursor-default">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900">5 Min</div>
                  <div className="text-sm text-slate-600">Quick Read</div>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Newsletter Preview Cards Section */}
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
                    {allNewsletters?.length || 0} articles • Updated daily
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
                        ? `Showing ${newsletters.length} of ${allNewsletters?.length || 0} newsletters`
                        : 'No matches found'}
                    </p>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-200 h-48" />
                      <div className="p-5 space-y-3">
                        <div className="h-5 bg-slate-200 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                        <div className="space-y-2 pt-2">
                          <div className="h-3 bg-slate-200 rounded w-full" />
                          <div className="h-3 bg-slate-200 rounded w-5/6" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !newsletters || newsletters.length === 0 ? (
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
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

