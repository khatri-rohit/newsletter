/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/footer";
import { Header } from "@/components/header";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Sparkles, Calendar, Clock } from "lucide-react";
import { Newsletter } from "@/services/types";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/newsletters?status=published&limit=6');
        const data = await response.json();

        if (data.success) {
          setNewsletters(data.data.newsletters || []);
        }
      } catch (error) {
        console.error('Error fetching newsletters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsletters();
  }, []);

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
      month: 'short',
      day: 'numeric',
    });
  };

  const handleNewsletterClick = (slug: string) => {
    router.push(`/p/${slug}`);
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Hero Section */}
      <main className="relative overflow-hidden">

        <div className="container relative mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-20">
          {/* Hero Content */}
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Main Heading with animated gradient */}
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-white/50 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">AI News, Simplified</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                Stay Ahead in AI
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Curated insights, breakthrough developments, and expert analysis delivered to your inbox every morning.
              </p>
            </div>

            {/* Newsletter Form with enhanced styling */}
            <div className="">
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
        <div className="relative py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              {newsletters.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-slate-600">
                    No newsletters available yet. Check back soon!
                  </p>
                </div>
              ) : (
                <>
                  {/* Responsive Grid of Newsletter Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {newsletters.map((newsletter) => (
                      <Card
                        key={newsletter.id}
                        className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden border border-slate-200 p-0 gap-0 cursor-pointer transition-all duration-300"
                      >
                        {/* Thumbnail Image */}
                        {newsletter.thumbnail && (
                          <div
                            className="w-full h-48 overflow-hidden"
                            onClick={() => handleNewsletterClick(newsletter.slug)}
                          >
                            <img
                              src={newsletter.thumbnail}
                              alt={newsletter.title}
                              className="w-full h-full object-cover object-top transition-transform duration-500"
                            />
                          </div>
                        )}

                        {/* Card Header */}
                        <CardHeader
                          className="p-6 border-b border-slate-200 bg-linear-to-br from-blue-50 to-indigo-50 gap-0 grid-rows-none grid-cols-none auto-rows-auto"
                          onClick={() => handleNewsletterClick(newsletter.slug)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {/* {newsletter.tags && newsletter.tags.length > 0 && (
                                <div className="text-xs font-semibold text-blue-600 mb-2 uppercase">
                                  {newsletter.tags[0]}
                                </div>
                              )} */}
                              <h3 className="text-xl font-bold text-slate-900 line-clamp-2 transition-colors">
                                {newsletter.title}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(newsletter.publishedAt || newsletter.createdAt)}
                            </span>
                            {newsletter.metadata && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {newsletter.metadata.readTime} min
                              </span>
                            )}
                          </div>
                        </CardHeader>

                        {/* Card Body */}
                        <CardContent className="p-6 space-y-4">
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                            {newsletter.excerpt || 'Click to read the full newsletter...'}
                          </p>

                          {/* Tags */}
                          {/* {newsletter.tags && newsletter.tags.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                              {newsletter.tags.slice(1, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )} */}
                        </CardContent>

                        {/* Card Footer */}
                        <CardFooter className="px-6 pb-6 pt-0">
                          <div className="flex items-center justify-between text-xs text-slate-500 w-full">
                            <span className="flex items-center gap-1">
                              {isAdmin && newsletter.views !== undefined ? `${newsletter.views} views` : ''}
                            </span>
                            <button
                              onClick={() => handleNewsletterClick(newsletter.slug)}
                              className="font-semibold text-gray-600 group-hover:underline"
                            >
                              Read More →
                            </button>
                          </div>
                        </CardFooter>

                        {/* Hover Gradient Effect */}
                        <div className="absolute inset-0 bg-linear-to-t from-blue-500/0 via-transparent to-transparent group-hover:from-blue-500/5 transition-all duration-500 pointer-events-none" />
                      </Card>
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

