import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header classname="max-w-5xl" />

            <main className="flex-1 container mx-auto py-8 pt-20 max-w-5xl px-4">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                        <FileQuestion className="h-10 w-10 text-gray-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Newsletter Not Found
                    </h1>

                    <p className="text-gray-600 mb-8 max-w-md">
                        The newsletter you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>

                    <div className="flex gap-4">
                        <Button
                            asChild
                            className="bg-black text-white hover:bg-gray-800"
                        >
                            <Link href="/">
                                Back to Home
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="border-gray-300"
                        >
                            <Link href="/#newsletters">
                                Browse Newsletters
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
