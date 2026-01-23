'use client';

import { Sparkles } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-30 animate-pulse" />
                <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/50 animate-pulse">
                    <Sparkles className="h-12 w-12 text-white" />
                </div>
            </div>
        </div>
    );
}
