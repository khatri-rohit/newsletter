/* eslint-disable @next/next/no-img-element */
'use client';

import { Linkedin, User } from 'lucide-react';
import { NewsletterSubscribe } from './newsletter-subscribe';
import Link from 'next/link';
import Image from 'next/image';

const Footer = ({ classname }: { classname?: string }) => {
    return (
        <footer className={`${classname ? classname : 'max-w-7xl'} container mx-auto relative border-t border-slate-200 bg-white/50 backdrop-blur-sm`}>
            <div className="container mx-auto px-4 py-8 sm:py-12">
                {/* Top Section */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${classname ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-5 lg:gap-12 mb-8`}>
                    {/* Left - Logo and Tagline */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-3 w-fit group" aria-label="Low Noise Home">
                            <div className="relative h-8 w-8 sm:h-9 sm:w-9 transition-transform">
                                <Image
                                    src="/lownoise.png"
                                    alt="Low Noise Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-lg sm:text-xl font-bold text-slate-900 transition-colors">
                                Low Noise
                            </span>
                        </Link>
                        <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                            Need-to-know AI news, minus the fluff—served bite-size, every day.
                        </p>
                    </div>

                    {/* Center - Navigation */}
                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-slate-900 text-base">Navigation</h3>
                        <nav className="flex flex-col gap-1 md:gap-2" aria-label="Footer navigation">
                            <Link
                                href="/"
                                className="text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit"
                            >
                                Home
                            </Link>
                            <Link
                                href="/"
                                className="text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit"
                            >
                                Posts
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="/terms"
                                className="text-sm text-slate-600 hover:text-blue-600 transition-colors w-fit"
                            >
                                Terms of Service
                            </Link>
                        </nav>
                    </div>

                    {/* Right - Subscribe */}
                    <div className={`space-y-3 sm:col-span-2 ${classname ? "lg:col-span-2" : "lg:col-span-1"}`}>
                        <h3 className="font-semibold text-slate-900 text-base">Subscribe</h3>
                        <div className="w-full max-w-md">
                            <NewsletterSubscribe />
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-6 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Social Icons */}
                        <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
                            <a
                                href="https://x.com/rohitxdotdev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-10.5 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all"
                                aria-label="Follow us on Twitter"
                            >
                                <img
                                    src="/x.svg"
                                    alt="Follow us on Twitter"
                                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-80"
                                    loading="lazy"
                                />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/rohitkhatri302"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-10.5 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all"
                                aria-label="Connect on LinkedIn"
                            >
                                <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-700" />
                            </a>
                            <a
                                href="https://thisisrohit.dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-10.5 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all"
                                aria-label="Visit my website"
                            >
                                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-700" />
                            </a>
                        </div>

                        {/* Copyright */}
                        <p className="text-xs sm:text-sm text-slate-600 text-center sm:text-left order-1 sm:order-2">
                            © 2026 Low Noise. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer