/* eslint-disable react/no-unescaped-entities */
'use client';

import { Header } from "@/components/header";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { Newspaper, Clock, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Minimal and Clean */}
      <main className="relative">
        <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Logo Mark */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="h-16 w-16 border-2 border-foreground flex items-center justify-center">
                  <span className="font-mono text-2xl font-bold">R</span>
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-foreground" />
              </div>
            </div>

            {/* Main Heading */}
            <div className="space-y-6 text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight">
                The Recap AI
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
                Need-to-know AI news, minus the fluff—served bite-size, every day.
              </p>
            </div>

            {/* Newsletter Form */}
            <div className="pt-8">
              <NewsletterSubscribe />
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Daily at 7AM</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>10,000+ Readers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Newspaper className="h-4 w-4" />
                <span>5 Min Read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 md:gap-16">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="space-y-4"
                  >
                    <div className="h-10 w-10 border border-foreground/20 flex items-center justify-center">
                      <span className="font-mono text-sm font-medium">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="text-2xl font-light">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Archive Preview Section */}
        <div className="border-t border-border">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl md:text-4xl font-light">Archive</h2>
                <p className="text-muted-foreground">Browse past editions</p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="group border border-border hover:border-foreground/20 transition-colors p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">
                            Dec {String(31 - i).padStart(2, '0')}, 2025
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">5 min read</span>
                        </div>
                        <h3 className="text-xl font-light group-hover:underline cursor-pointer">
                          OpenAI issues 'code red' over Gemini 3
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          PLUS: ChatGPT comes to Google's AI, unruly AI sends brain, and Howard Marks on the AI bubble.
                        </p>
                      </div>
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                        →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 border border-foreground flex items-center justify-center">
                <span className="font-mono text-xs font-bold">R</span>
              </div>
              <span className="font-light">The Recap AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 The Recap AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Curated Daily",
    description: "Every morning, we distill hundreds of AI developments into the 5-10 stories that actually matter. Zero noise, pure signal.",
  },
  {
    title: "Context Included",
    description: "We don't just report what happened—we explain why it matters and what it means for the future of AI and technology.",
  },
  {
    title: "Quick to Read",
    description: "Designed to be consumed over coffee. Get fully informed in under 5 minutes, then get on with your day.",
  },
  {
    title: "Completely Free",
    description: "No paywalls, no premium tiers. Just quality AI journalism delivered straight to your inbox every single day.",
  },
];

