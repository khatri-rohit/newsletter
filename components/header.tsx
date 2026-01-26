'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';
import { UserMenu } from './user-menu';
import Link from 'next/link';

export function Header({ classname }: { classname?: string }) {
    const { user } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            <header className={`${classname ? classname : 'max-w-7xl'} container mx-auto fixed top-0 left-1/2 w-full z-50 bg-transparent backdrop-blur-md -translate-x-1/2`}>
                <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Link href="/" className="text-sm sm:text-base md:text-lg font-bold truncate py-3">
                            Low Noise
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {user ? (
                            <UserMenu />
                        ) : (
                            <Button
                                onClick={() => setAuthModalOpen(true)}
                                variant="default"
                                size="sm"
                                className="h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm cursor-pointer"
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
