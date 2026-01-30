'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Header component with no SSR
// This prevents auth-related hydration issues and improves initial load
const Header = dynamic(
    () => import('./header').then(mod => ({ default: mod.Header })),
    {
        ssr: false,
        loading: () => (
            <header className="max-w-7xl container mx-auto fixed top-0 left-1/2 w-full z-40 bg-transparent backdrop-blur-md -translate-x-1/2 transition-transform duration-300">
                <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 bg-slate-200 rounded animate-pulse" />
                        <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                </div>
            </header>
        )
    }
);

export function HeaderWrapper({ classname }: { classname?: string }) {
    return <Header classname={classname} />;
}
