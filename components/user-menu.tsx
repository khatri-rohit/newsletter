/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, Mail, Calendar, Shield, Bell, BellOff, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function UserMenu() {
    const { user, signOut, isAdmin } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        isSubscribed: boolean;
        status: string;
        subscribedAt?: any;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (profileOpen && user) {
            fetchSubscriptionStatus();
        }
    }, [profileOpen, user]);

    const fetchSubscriptionStatus = async () => {
        setLoading(true);
        try {
            const idToken = await user?.getIdToken();
            const response = await fetch('/api/user/subscription', {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setSubscriptionStatus(data.data);
            } else {
                toast.error('Failed to load subscription status');
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            toast.error('Failed to load subscription status');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setActionLoading(true);
        try {
            const idToken = await user?.getIdToken();
            const response = await fetch('/api/user/subscription', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Successfully subscribed to newsletter! 🎉');
                await fetchSubscriptionStatus();
            } else {
                toast.error(data.error || 'Failed to subscribe');
            }
        } catch (error) {
            console.error('Error subscribing:', error);
            toast.error('Failed to subscribe');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        // if (!confirm('Are you sure you want to unsubscribe from the newsletter?')) {
        //     return;
        // }

        setActionLoading(true);
        try {
            const idToken = await user?.getIdToken();
            const response = await fetch('/api/user/subscription', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Successfully unsubscribed from newsletter');
                await fetchSubscriptionStatus();
            } else {
                toast.error(data.error || 'Failed to unsubscribe');
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
            toast.error('Failed to unsubscribe');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return 'N/A';
        let date: Date;

        if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
            date = (timestamp as { toDate: () => Date }).toDate();
        } else if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp) {
            date = new Date((timestamp as { _seconds: number })._seconds * 1000);
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return 'N/A';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (!user) return null;

    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback className="bg-foreground text-background text-xs">
                                {getInitials(user.displayName)}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {user.displayName || 'User'}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setProfileOpen(true)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={signOut}
                        className="cursor-pointer text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dialog */}
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-xl sm:text-2xl">
                            <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                                <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-base sm:text-xl">
                                    {getInitials(user.displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="truncate">{user.displayName || 'User'}</span>
                                    {isAdmin && (
                                        <Badge variant="default" className="bg-linear-to-r from-amber-500 to-orange-600 text-xs sm:text-sm">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Admin
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="text-sm sm:text-base mt-1">
                                    Manage your profile and subscription preferences
                                </DialogDescription>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Account Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Account Information
                            </h3>
                            <div className="space-y-4 bg-slate-50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-gray-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">Display Name</p>
                                        <p className="font-medium">{user.displayName || 'Not set'}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                                    <div className="flex-1">
                                        <div className='flex items-center gap-2'>
                                            <p className="text-sm text-gray-500">Email Address</p>{user.emailVerified ? (
                                                <Badge variant="secondary" className="mt-1">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="mt-1">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Not Verified
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-medium break-all">{user.email}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">Account Created</p>
                                        <p className="font-medium">
                                            {user.metadata?.creationTime
                                                ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Newsletter Subscription */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Newsletter Subscription
                            </h3>

                            {loading ? (
                                <div className="relative overflow-hidden bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/30 rounded-xl p-8 text-center border border-slate-200/60">
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm shadow-lg mb-4">
                                            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-blue-600"></div>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">Loading subscription status...</p>
                                    </div>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                                </div>
                            ) : subscriptionStatus ? (
                                <div className="relative overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-50/50 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                                    {/* Decorative background elements */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                                    <div className="relative z-10 p-6">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                {subscriptionStatus.isSubscribed ? (
                                                    <div className="relative">
                                                        <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 animate-[pulse_2s_ease-in-out_infinite]">
                                                            <Bell className="h-7 w-7 text-white" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white animate-ping"></div>
                                                    </div>
                                                ) : (
                                                    <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-300/50">
                                                        <BellOff className="h-7 w-7 text-slate-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-xl bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                                        {subscriptionStatus.isSubscribed ? 'Active Subscription' : 'Not Subscribed'}
                                                    </p>
                                                    <p className="text-sm text-slate-600 mt-0.5">
                                                        {subscriptionStatus.isSubscribed
                                                            ? 'Receiving our latest updates & insights'
                                                            : 'Join our community for exclusive content'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={subscriptionStatus.isSubscribed ? 'default' : 'secondary'}
                                                className={`${subscriptionStatus.isSubscribed
                                                    ? 'bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm'
                                                    : 'bg-slate-200 text-slate-700'
                                                    } px-3 py-1 font-semibold tracking-wide uppercase text-xs`}
                                            >
                                                {subscriptionStatus.status}
                                            </Badge>
                                        </div>

                                        {subscriptionStatus.isSubscribed && subscriptionStatus.subscribedAt && (
                                            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-5 border border-slate-200/50 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar className="h-4 w-4 text-slate-500" />
                                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Member Since</p>
                                                </div>
                                                <p className="font-semibold text-slate-800 text-lg">{formatDate(subscriptionStatus.subscribedAt)}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            {subscriptionStatus.isSubscribed ? (
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 font-semibold transition-all duration-200 h-11"
                                                    onClick={handleUnsubscribe}
                                                    disabled={actionLoading}
                                                >
                                                    <BellOff className="h-4 w-4 mr-2" />
                                                    {actionLoading ? 'Processing...' : 'Unsubscribe'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="flex-1 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 h-11 animate-[shimmer_2s_ease-in-out_infinite] bg-size-[200%_100%]"
                                                    onClick={handleSubscribe}
                                                    disabled={actionLoading}
                                                >
                                                    <Bell className="h-4 w-4 mr-2" />
                                                    {actionLoading ? 'Processing...' : 'Subscribe Now'}
                                                </Button>
                                            )}
                                        </div>

                                        {subscriptionStatus.isSubscribed && (
                                            <p className="text-xs text-slate-500 mt-4 text-center flex items-center justify-center gap-1.5">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                You can unsubscribe anytime with one click
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-linear-to-br from-red-50 to-orange-50/30 rounded-xl p-8 text-center border border-red-200/50">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-3">
                                        <XCircle className="h-7 w-7 text-red-600" />
                                    </div>
                                    <p className="text-slate-700 font-medium mb-3">Failed to load subscription status</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchSubscriptionStatus}
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Separator className="my-6" />

                        {/* Additional Info */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                                <strong>Privacy Note:</strong> Your information is secure and will only be used to send
                                you newsletter updates. We never share your data with third parties.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
