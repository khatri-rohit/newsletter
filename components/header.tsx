'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ModeToggle } from './theme-toggle';
import { AuthModal } from './auth-modal';
import { UserMenu } from './user-menu';
import { Mail } from 'lucide-react';

export function Header() {
    const { user } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 dark:bg-slate-800 flex items-center justify-center shadow-md">
                            <Mail className="h-4 w-4 text-white dark:text-slate-300" />
                        </div>
                        <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                            AI Intelligence Brief
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModeToggle />
                        {user ? (
                            <UserMenu />
                        ) : (
                            <Button
                                onClick={() => setAuthModalOpen(true)}
                                variant="outline"
                                size="sm"
                                className="font-light"
                            >
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </header>
            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        </>
    );
}
