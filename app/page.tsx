/* eslint-disable react/no-unescaped-entities */
'use client';

import { Header } from "@/components/header";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { Mail, Sparkles, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <Header />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-40 left-10 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>

        <div className="container relative mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-20">
          {/* Hero Content */}
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Main Heading with animated gradient */}
            <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">AI News, Simplified</span>
              </div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-100 bg-clip-text text-transparent leading-tight">
                Your Daily AI<br />Intelligence Brief
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Curated insights, breakthrough developments, and expert analysis delivered to your inbox every morning.
              </p>
            </div>

            {/* Newsletter Form with enhanced styling */}
            <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000" style={{ animationDelay: '200ms' }}>
              <NewsletterSubscribe />
            </div>

            {/* Stats with icons */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-3 group cursor-default">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">Daily</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">7 AM Delivery</div>
                </div>
              </div>

              <div className="flex items-center gap-3 group cursor-default">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">10K+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Active Readers</div>
                </div>
              </div>

              <div className="flex items-center gap-3 group cursor-default">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">5 Min</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Quick Read</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Preview Cards Section */}
        <div className="relative py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                  What You'll Receive
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Professional, well-designed newsletters that make AI news digestible and actionable
                </p>
              </div>

              {/* Responsive Grid of Newsletter Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {newsletterPreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200 dark:border-slate-700 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${600 + index * 150}ms`, animationDuration: '1000ms' }}
                  >
                    {/* Card Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                            {preview.category}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {preview.title}
                          </h3>
                        </div>
                        <div className="text-3xl opacity-20 group-hover:opacity-40 transition-opacity">
                          {preview.icon}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {preview.date}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                        {preview.excerpt}
                      </p>

                      {/* Key Points */}
                      <div className="space-y-2">
                        {preview.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span className="text-blue-500 dark:text-blue-400 mt-0.5">▸</span>
                            <span className="line-clamp-1">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{preview.readTime}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline cursor-pointer">
                          Read More →
                        </span>
                      </div>
                    </div>

                    {/* Hover Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/0 via-transparent to-transparent group-hover:from-blue-500/5 transition-all duration-500 pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Intelligence Brief
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2026 AI Intelligence Brief. Elevating your AI knowledge.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const newsletterPreviews = [
  {
    category: "BREAKTHROUGH",
    title: "OpenAI Unveils GPT-5: Multimodal Revolution",
    date: "Jan 24, 2026",
    icon: "🚀",
    excerpt: "OpenAI's latest flagship model demonstrates unprecedented reasoning capabilities across text, vision, and audio. Early benchmarks show 40% improvement in complex problem-solving tasks.",
    highlights: [
      "Native video understanding without transcription",
      "Real-time multilingual translation across 100+ languages",
      "Advanced reasoning chains with explainable AI outputs"
    ],
    readTime: "4 min read"
  },
  {
    category: "INDUSTRY SHIFT",
    title: "Google Merges DeepMind with Cloud AI Division",
    date: "Jan 23, 2026",
    icon: "🔄",
    excerpt: "In a strategic restructuring, Google consolidates its AI research and product teams to accelerate enterprise AI adoption. This move signals a shift towards commercialization of cutting-edge research.",
    highlights: [
      "Unified AI platform launching Q2 2026",
      "New enterprise pricing models announced",
      "Focus on healthcare and scientific discovery applications"
    ],
    readTime: "5 min read"
  },
  {
    category: "POLICY UPDATE",
    title: "EU AI Act: New Compliance Deadlines Announced",
    date: "Jan 22, 2026",
    icon: "⚖️",
    excerpt: "The European Commission releases detailed implementation timeline for the AI Act. High-risk AI systems face stricter requirements starting July 2026, impacting global tech companies.",
    highlights: [
      "Mandatory risk assessments for foundation models",
      "Transparency requirements for generative AI",
      "Penalties up to 6% of global revenue for violations"
    ],
    readTime: "6 min read"
  }
];

