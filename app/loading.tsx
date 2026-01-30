export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Skeleton */}
            <header className="max-w-7xl container mx-auto fixed top-0 left-1/2 w-full z-40 bg-transparent backdrop-blur-md -translate-x-1/2">
                <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 bg-slate-200 rounded animate-pulse" />
                        <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                </div>
            </header>

            {/* Hero Section Skeleton */}
            <main className="relative overflow-hidden">
                <div className="container relative mx-auto px-3 sm:px-4 pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-28 md:pb-20">
                    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
                        <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center">
                            <div className="h-8 bg-slate-200 rounded-full w-48 mx-auto animate-pulse" />
                            <div className="h-16 bg-slate-200 rounded w-3/4 mx-auto animate-pulse" />
                            <div className="h-8 bg-slate-200 rounded w-2/3 mx-auto animate-pulse" />
                        </div>
                        <div className="h-12 bg-slate-200 rounded w-full max-w-md mx-auto animate-pulse" />
                    </div>
                </div>

                {/* Newsletter Section Skeleton */}
                <div className="relative py-16 md:py-16 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-12 space-y-6">
                                <div className="text-center space-y-3">
                                    <div className="h-10 bg-slate-200 rounded w-64 mx-auto animate-pulse" />
                                    <div className="h-6 bg-slate-200 rounded w-96 mx-auto animate-pulse" />
                                </div>
                                <div className="h-12 bg-slate-200 rounded w-full max-w-2xl mx-auto animate-pulse" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white rounded-lg border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-200 h-48" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-5 bg-slate-200 rounded w-3/4" />
                                            <div className="h-4 bg-slate-200 rounded w-1/2" />
                                            <div className="space-y-2 pt-2">
                                                <div className="h-3 bg-slate-200 rounded w-full" />
                                                <div className="h-3 bg-slate-200 rounded w-5/6" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
