'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
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
        } catch (error) {
            console.error('Failed to sign in with Google:', error);
        } finally {
            setLoading(null);
        }
    };

    const handleGithubSignIn = async () => {
        try {
            setLoading('github');
            await signInWithGithub();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to sign in with Github:', error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-light">
                        Sign In
                    </DialogTitle>
                    <DialogDescription className="font-light">
                        Choose your preferred authentication method
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-4">
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={loading !== null}
                        variant="outline"
                        className="w-full h-11 font-light"
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
                        className="w-full h-11 font-light"
                    >
                        {loading === 'github' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Github className="mr-2 h-4 w-4" />
                        )}
                        <span>Continue with GitHub</span>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground pt-4">
                        By continuing, you agree to our Terms and Privacy Policy
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
