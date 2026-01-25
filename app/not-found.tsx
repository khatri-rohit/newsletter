// ==========================================
// CUSTOM NOT FOUND PAGE
// ==========================================

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-16 pt-24 flex items-center justify-center">
                <div className="max-w-md w-full text-center space-y-6">
                    {/* 404 Animation */}
                    <div className="relative">
                        <h1 className="text-9xl font-bold text-slate-200 select-none">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-12 h-12 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-900">
                            Page Not Found
                        </h2>
                        <p className="text-lg text-slate-600">
                            The page you're looking for doesn't exist or has been moved.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <Link href="/">
                            <Button className="w-full sm:w-auto">
                                <Home className="h-4 w-4 mr-2" />
                                Go Home
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}