/* eslint-disable @next/next/no-img-element */
'use client';
import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { LoadingScreen } from '@/components/loading-screen';
import { useGetNewslettersQuery, useDeleteNewsletterMutation } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Edit,
    Calendar,
    Plus,
    Inbox,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/helpers';

export default function AdminDraftsPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    const { data: draftsData, isLoading: loadingDrafts } = useGetNewslettersQuery({
        status: 'draft',
        limit: 50,
    });

    const [deleteNewsletter] = useDeleteNewsletterMutation();
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(id);
        try {
            await deleteNewsletter(id).unwrap();
            toast.success('Draft deleted successfully');
        } catch (error) {
            console.error('Error deleting draft:', error);
            toast.error('Failed to delete draft. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (timestamp: unknown): string => {
        return formatTimestamp(timestamp, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading || loadingDrafts) {
        return <LoadingScreen />;
    }

    if (!user || !isAdmin) {
        router.push('/');
        return null;
    }

    const drafts = draftsData?.data?.newsletters || [];

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-16 sm:pt-20 max-w-7xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                            My Drafts
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            Continue working on your saved newsletters
                        </p>
                    </div>
                    <Link href="/admin/post">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Newsletter
                        </Button>
                    </Link>
                </div>

                {/* Drafts List */}
                {drafts.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Inbox className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No drafts yet</h3>
                        <p className="text-gray-600 mb-6">
                            Start writing your first newsletter
                        </p>
                        <Link href="/admin/post">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Newsletter
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:gap-6">
                        {drafts.map((draft) => (
                            <Card key={draft.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Thumbnail */}
                                    {draft.thumbnail && (
                                        <div className="w-full sm:w-48 h-32 shrink-0">
                                            <img
                                                src={draft.thumbnail}
                                                alt={draft.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h2 className="text-xl sm:text-2xl font-bold line-clamp-2">
                                                {draft.title || 'Untitled Draft'}
                                            </h2>
                                            <Badge variant="secondary">Draft</Badge>
                                        </div>

                                        {draft.excerpt && (
                                            <p className="text-gray-600 line-clamp-2 mb-3">
                                                {draft.excerpt}
                                            </p>
                                        )}

                                        {/* Meta Info */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(draft.updatedAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                {draft.metadata?.wordCount || 0} words
                                            </span>
                                        </div>

                                        {/* Tags */}
                                        {draft.tags && draft.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {draft.tags.slice(0, 3).map((tag) => (
                                                    <Badge key={tag} variant="outline">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {draft.tags.length > 3 && (
                                                    <Badge variant="outline">
                                                        +{draft.tags.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Link href={`/admin/post?id=${draft.id}`}>
                                                <Button>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Continue Editing
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDelete(draft.id!, draft.title)}
                                                disabled={deletingId === draft.id}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {deletingId === draft.id ? 'Deleting...' : 'Delete'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
