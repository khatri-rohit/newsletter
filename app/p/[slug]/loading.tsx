import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header classname="max-w-5xl" />

            <main className="px-2 md:px-1 flex-1 container mx-auto py-8 pt-20 max-w-5xl">
                {/* Breadcrumb skeleton */}
                <div className="mb-6 flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                </div>

                {/* Header skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-10 w-3/4 mb-4" />
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <div className="flex gap-4 mb-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                </div>

                {/* Thumbnail skeleton */}
                <Skeleton className="w-full h-96 mb-8 rounded-lg" />

                {/* Content skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <div className="py-4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </main>

            <Footer />
        </div>
    );
}
