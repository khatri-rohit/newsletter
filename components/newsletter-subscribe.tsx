'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export function NewsletterSubscribe() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            setStatus('idle');
            setMessage('');

            // Check if email already exists
            const subscribersRef = collection(db, 'subscribers');
            const q = query(subscribersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setStatus('error');
                setMessage('This email is already subscribed!');
                setLoading(false);
                return;
            }

            // Add new subscriber
            await addDoc(subscribersRef, {
                email,
                subscribedAt: serverTimestamp(),
                status: 'active',
            });

            setStatus('success');
            setMessage('Successfully subscribed! Check your inbox.');
            setEmail('');

            // Reset status after 5 seconds
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        } catch (error) {
            console.error('Error subscribing:', error);
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="flex-1 h-11 font-light"
                />
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 font-light"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Subscribe'
                    )}
                </Button>
            </form>

            {status !== 'idle' && (
                <div
                    className={`flex items-center justify-center gap-2 p-3 border text-sm ${status === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800'
                            : 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800'
                        }`}
                >
                    {status === 'success' ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="font-light">{message}</span>
                </div>
            )}
        </div>
    );
}
