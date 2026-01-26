'use client';

import { useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Newsletter page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header classname="max-w-5xl" />

            <main className="flex-1 container mx-auto py-8 pt-20 max-w-5xl px-4">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-10 w-10 text-red-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Oops! Something went wrong
                    </h1>

                    <p className="text-gray-600 mb-8 max-w-md">
                        We&apos;re sorry for the inconvenience. Please try refreshing the page.
                    </p>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => reset()}
                            className="bg-black text-white hover:bg-gray-800"
                        >
                            Refresh Page
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            className="border-gray-300"
                        >
                            Go Home
                        </Button>
                    </div>

                    {process.env.NODE_ENV === 'development' && error.digest && (
                        <p className="mt-8 text-sm text-gray-500">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
