'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';
import { UserMenu } from './user-menu';
import Link from 'next/link';
import Image from 'next/image';

export function Header({ classname }: { classname?: string }) {
    const { user, isAdmin } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            <header className={`${classname ? classname : 'max-w-7xl'} container mx-auto fixed top-0 left-1/2 w-full z-40 bg-transparent backdrop-blur-md -translate-x-1/2`}>
                <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group py-3" aria-label="Low Noise Home">
                            <div className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 transition-transform">
                                <Image
                                    src="/lownoise.png"
                                    alt="Low Noise Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-sm sm:text-base md:text-lg font-bold text-slate-900 transition-colors">
                                Low Noise
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {user && isAdmin && (
                            <Button
                                onClick={() => window.location.href = '/admin/drafts'}
                                variant="default"
                                size="sm"
                                className="h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm cursor-pointer">
                                Admin
                            </Button>
                        )}
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
