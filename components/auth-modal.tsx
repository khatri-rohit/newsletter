/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Github, Mail, Loader2 } from 'lucide-react';

interface AuthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
    const { signInWithGoogle, signInWithGithub } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        try {
            setLoading('google');
            await signInWithGoogle();
            onOpenChange(false);
            toast.success('Successfully signed in with Google!');
        } catch (error: any) {
            console.error('Failed to sign in with Google:', error);

            // Don't show toast for user-cancelled actions
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return;
            }

            toast.error(error.userMessage || 'Failed to sign in with Google. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const handleGithubSignIn = async () => {
        try {
            setLoading('github');
            await signInWithGithub();
            onOpenChange(false);
            toast.success('Successfully signed in with GitHub!');
        } catch (error: any) {
            console.error('Failed to sign in with Github:', error);

            // Don't show toast for user-cancelled actions
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return;
            }

            toast.error(error.userMessage || 'Failed to sign in with GitHub. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-100">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-light">
                        Sign In
                    </DialogTitle>
                    <DialogDescription className="font-light">
                        Choose your preferred authentication method
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4">
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={loading !== null}
                        variant="outline"
                        className="w-full h-10 sm:h-11 text-sm sm:text-base font-light"
                    >
                        {loading === 'google' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Mail className="mr-2 h-4 w-4" />
                        )}
                        <span>Continue with Google</span>
                    </Button>
                    <Button
                        onClick={handleGithubSignIn}
                        disabled={loading !== null}
                        variant="outline"
                        className="w-full h-10 sm:h-11 text-sm sm:text-base font-light"
                    >
                        {loading === 'github' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Github className="mr-2 h-4 w-4" />
                        )}
                        <span>Continue with GitHub</span>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground pt-3 sm:pt-4">
                        By continuing, you agree to our Terms and Privacy Policy
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
