'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';
import { UserMenu } from './user-menu';
import { Mail } from 'lucide-react';

export function Header() {
    const { user } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            <header className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                            <Mail className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-base font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            AI Intelligence Brief
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
