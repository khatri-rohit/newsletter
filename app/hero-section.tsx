'use client';

import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { Sparkles } from "lucide-react";

export function HeroSection() {
    return (
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
            </div>
        </div>
    );
}
