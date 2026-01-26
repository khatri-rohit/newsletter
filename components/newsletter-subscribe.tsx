'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner"
import { z } from "zod";
import { useSubscribeMutation } from '@/lib/api';


export function NewsletterSubscribe() {
    const [email, setEmail] = useState('');
    const [subscribe, { isLoading }] = useSubscribeMutation();

    const schema = z.object({
        email: z.string().email(),
    });

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = schema.safeParse({ email });

        if (!validation.success) {
            toast.error('Invalid Email', {
                description: validation.error.issues[0].message,
                descriptionClassName: 'text-gray-900!',
            });
            return;
        }

        try {
            const result = await subscribe({ email }).unwrap();

            if (result.success) {
                toast.success('Success! 🎉', {
                    description: result.data?.message || 'You\'ve successfully subscribed!',
                    descriptionClassName: 'text-gray-900!',
                });
                setEmail('');
            } else {
                toast.error('Subscription Failed', {
                    description: result.error || 'Something went wrong. Please try again.',
                    descriptionClassName: 'text-gray-900!',
                });
            }
        } catch (error) {
            console.error('Error subscribing:', error);
            toast.error('Error', {
                description: 'Something went wrong. Please try again.',
                descriptionClassName: 'text-gray-900!',
            });
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
                    disabled={isLoading}
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base font-light"
                />
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 sm:h-11 px-6 sm:px-8 text-sm sm:text-base font-light cursor-pointer w-full sm:w-auto"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Subscribe'
                    )}
                </Button>
            </form>
        </div>
    );
}
