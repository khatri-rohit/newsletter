'use client';

import { Twitter, Linkedin } from 'lucide-react';
import { NewsletterSubscribe } from './newsletter-subscribe';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="relative border-t border-slate-200 bg-white/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-8">
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Left - Logo and Tagline */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">
                                Low Noise
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Need-to-know AI news, minus the fluff—served bite-size, every day.
                        </p>
                    </div>

                    {/* Center - Navigation */}
                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-slate-900">Navigation</h3>
                        <Link href="/" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                            Home
                        </Link>
                        <Link href="/" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                            Posts
                        </Link>
                    </div>

                    {/* Right - Subscribe */}
                    <div className="space-y-3 flex flex-col items-start justify-center">
                        <h3 className="font-semibold text-slate-900">Subscribe</h3>
                        <div className='-ml-4.5 w-full'>
                            <NewsletterSubscribe />
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-6 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Social Icons */}
                        <div className="flex items-center gap-3">
                            <a
                                href="https://x.com/rohitxdotdev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Twitter className="h-4 w-4 text-slate-700" />
                            </a>
                            <a
                                href="www.linkedin.com/in/rohitkhatri302"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Linkedin className="h-4 w-4 text-slate-700" />
                            </a>
                        </div>

                        {/* Copyright */}
                        <p className="text-sm text-slate-600">
                            © 2026 Low Noise. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer