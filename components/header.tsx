'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { ModeToggle } from './theme-toggle';
import { AuthModal } from './auth-modal';
import { UserMenu } from './user-menu';

export function Header() {
    const { user } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="h-6 w-6 border border-foreground flex items-center justify-center">
                                <span className="font-mono text-xs font-bold">R</span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 bg-foreground" />
                        </div>
                        <span className="font-light text-sm">The Recap AI</span>
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
