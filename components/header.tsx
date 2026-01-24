'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';
import { UserMenu } from './user-menu';

export function Header() {
    const { user } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-bold ">
                            Low Noise
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <UserMenu />
                        ) : (
                            <Button
                                onClick={() => setAuthModalOpen(true)}
                                variant="default"
                                size="sm"
                                className="py-5 px-5 cursor-pointer"
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
