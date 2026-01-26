'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner"
import { z } from "zod";


export function NewsletterSubscribe() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const schema = z.object({
        email: z.string().email(),
    });

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = schema.safeParse({ email });
        console.log(validation)

        if (!validation.success) {
            toast.error('Invalid Email', {
                description: validation.error.issues[0].message,
                descriptionClassName: 'text-gray-900!',
            });
            return;
        }

        try {
            setLoading(true);

            // Call API route instead of direct Firestore access
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Success! 🎉', {
                    description: data.message,
                    descriptionClassName: 'text-gray-900!',
                });
                setEmail('');
            } else {
                toast.error('Subscription Failed', {
                    description: data.error || 'Something went wrong. Please try again.',
                    descriptionClassName: 'text-gray-900!',
                });
            }
        } catch (error) {
            console.error('Error subscribing:', error);
            toast.error('Error', {
                description: 'Something went wrong. Please try again.',
                descriptionClassName: 'text-gray-900!',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base font-light"
                />
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-10 sm:h-11 px-6 sm:px-8 text-sm sm:text-base font-light cursor-pointer w-full sm:w-auto"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Subscribe'
                    )}
                </Button>
            </form>
        </div>
    );
}
