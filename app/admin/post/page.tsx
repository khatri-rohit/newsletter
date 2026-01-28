/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { LoadingScreen } from '@/components/loading-screen';
import {
    Save,
    Eye,
    Send,
    X,
    Calendar,
    Tag,
    FileText,
    Image as ImageIcon,
} from 'lucide-react';
import {
    useUploadImageMutation,
    useCreateNewsletterMutation,
    useUpdateNewsletterMutation,
    useGetNewsletterByIdQuery
} from '@/lib/api';

interface NewsletterFormData {
    title: string;
    content: string;
    excerpt: string;
    thumbnail: string;
    tags: string[];
    status: 'draft' | 'published' | 'scheduled';
}

function AdminPostContent() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const newsletterId = searchParams.get('id');

    const [currentTab, setCurrentTab] = useState('edit');
    const [tagInput, setTagInput] = useState('');
    const [currentNewsletterId, setCurrentNewsletterId] = useState<string | null>(newsletterId);

    // RTK Query hooks
    const [uploadImage, { isLoading: thumbnailUploading }] = useUploadImageMutation();
    const [createNewsletter, { isLoading: creating }] = useCreateNewsletterMutation();
    const [updateNewsletter, { isLoading: updating }] = useUpdateNewsletterMutation();
    const { data: existingNewsletter, isLoading: loadingNewsletter } = useGetNewsletterByIdQuery(
        currentNewsletterId || '',
        { skip: !currentNewsletterId }
    );
    const [publishing, setPublishing] = useState(false);

    const saving = creating || updating;

    const [formData, setFormData] = useState<NewsletterFormData>({
        title: '',
        content: '',
        excerpt: '',
        thumbnail: '',
        tags: [],
        status: 'draft',
    });

    // Load existing newsletter if ID is provided
    useEffect(() => {
        if (existingNewsletter?.data) {
            const newsletter = existingNewsletter.data;
            setFormData({
                title: newsletter.title || '',
                content: newsletter.content || '',
                excerpt: newsletter.excerpt || '',
                thumbnail: newsletter.thumbnail || '',
                tags: newsletter.tags || [],
                status: newsletter.status || 'draft',
            });
            console.log('[Admin] Loaded existing newsletter:', newsletter.id);
        }
    }, [existingNewsletter]);

    // Check if user is admin
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
            // toast.error('Please sign in to access this page', {
            //     description: 'Unauthorized access',
            // });
            return;
        }

        // Check admin role from Firebase custom claims
        if (user) {
            // Force refresh token to get latest custom claims
            user.getIdToken(true).then(() => {
                return user.getIdTokenResult();
            }).then((idTokenResult) => {
                console.log('Token Result:', idTokenResult);
                console.log('Role Claim:', idTokenResult.claims.role);

                if (idTokenResult.claims.role === 'admin') {
                    // router.push('/');
                    // toast({
                    //     title: 'Access Denied',
                    //     description: 'You do not have permission to access this page',
                    //     variant: 'error',
                    // });
                }
            }).catch((error) => {
                console.error('Error checking admin status:', error);
                toast.error('Failed to verify admin status');
            });
        }
    }, [user, loading, router, toast]);

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('[Upload] No file selected');
            return;
        }

        console.log('[Upload] File selected:', {
            name: file.name,
            type: file.type,
            size: file.size,
        });

        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append('file', file);

            // console.log('[Upload] FormData created, uploading...');
            const result = await uploadImage(formDataToUpload).unwrap();
            // console.log('[Upload] Result:', result);

            if (result.success && result.data) {
                setFormData((prev) => ({ ...prev, thumbnail: result.data!.url }));
                toast.success('Thumbnail uploaded successfully');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('[Upload] Error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload thumbnail');
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const handleSaveDraft = async () => {
        if (!formData.title || !formData.content) {
            toast.error('Title and content are required');
            return;
        }

        try {
            let result;

            if (currentNewsletterId) {
                // Update existing draft
                result = await updateNewsletter({
                    id: currentNewsletterId,
                    ...formData,
                    status: 'draft',
                }).unwrap();
            } else {
                // Create new draft
                result = await createNewsletter({
                    ...formData,
                    status: 'draft',
                }).unwrap();

                // Store the ID for future updates
                if (result.success && result.data?.id) {
                    setCurrentNewsletterId(result.data.id);
                    // Update URL to include the ID
                    router.push(`/admin/post?id=${result.data.id}`);
                }
            }

            if (result.success) {
                toast.success(currentNewsletterId ? 'Draft updated successfully' : 'Draft saved successfully');
            } else {
                throw new Error(result.error || 'Failed to save draft');
            }
        } catch (error) {
            console.error('[Admin] Save draft error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save draft');
        }
    };

    const handlePublish = async () => {
        if (!formData.title || !formData.content || !formData.excerpt) {
            toast.error('Title, content, and excerpt are required for publishing');
            return;
        }

        setPublishing(true);
        try {
            let result;

            if (currentNewsletterId) {
                // Update existing draft to published
                result = await updateNewsletter({
                    id: currentNewsletterId,
                    ...formData,
                    status: 'published',
                }).unwrap();
            } else {
                // Create new published newsletter
                result = await createNewsletter({
                    ...formData,
                    status: 'published',
                }).unwrap();
            }

            if (result.success) {
                toast.success('Newsletter published successfully! 🎉');

                // Reset form and navigate to new post
                setFormData({
                    title: '',
                    content: '',
                    excerpt: '',
                    thumbnail: '',
                    tags: [],
                    status: 'draft',
                });
                setCurrentNewsletterId(null);
                router.push('/admin/post');
            } else {
                throw new Error(result.error || 'Failed to publish');
            }
        } catch (error) {
            console.error('[Admin] Publish error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to publish newsletter');
        } finally {
            setPublishing(false);
        }
    };

    if (loading || loadingNewsletter) {
        return <LoadingScreen />;
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-16 sm:pt-20 max-w-7xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                        {currentNewsletterId ? 'Edit Newsletter' : 'Create Newsletter'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        {currentNewsletterId ? 'Continue editing your newsletter draft' : 'Craft your next newsletter with our powerful editor'}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <Button
                        onClick={handleSaveDraft}
                        disabled={saving || publishing}
                        variant="outline"
                        className="text-xs sm:text-sm flex-1 sm:flex-none min-w-[100px]"
                    >
                        <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                        onClick={() => setCurrentTab('preview')}
                        variant="outline"
                        className="text-xs sm:text-sm flex-1 sm:flex-none min-w-[100px]"
                    >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Preview
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={saving || publishing}
                        className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm flex-1 sm:flex-none min-w-[100px]"
                    >
                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        {publishing ? 'Publishing...' : 'Publish'}
                    </Button>
                </div>

                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="edit">
                            <FileText className="h-4 w-4 mr-2" />
                            Edit
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="space-y-6">
                        {/* Thumbnail */}
                        <div className="space-y-2">
                            <Label htmlFor="thumbnail">
                                <ImageIcon className="h-4 w-4 inline mr-2" />
                                Thumbnail Image
                            </Label>
                            <div className="flex gap-4 items-start">
                                {formData.thumbnail && (
                                    <div className="relative">
                                        <img
                                            src={formData.thumbnail}
                                            alt="Thumbnail preview"
                                            className="w-48 h-32 object-cover rounded-lg"
                                        />
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2"
                                            onClick={() =>
                                                setFormData((prev) => ({ ...prev, thumbnail: '' }))
                                            }
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div>
                                    <Input
                                        id="thumbnail"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailUpload}
                                        disabled={thumbnailUploading}
                                        className="mb-2"
                                    />
                                    <p className="text-sm text-gray-500">
                                        {thumbnailUploading ? 'Uploading...' : 'Max 5MB, JPG/PNG/WebP'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm sm:text-base">Newsletter Title *</Label>
                            <Input
                                id="title"
                                placeholder="Enter a catchy title for your newsletter..."
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                                }
                                className="text-lg sm:text-xl md:text-2xl font-bold"
                            />
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt" className="text-sm sm:text-base">Excerpt / Summary *</Label>
                            <Textarea
                                id="excerpt"
                                placeholder="Write a brief summary that will appear in previews..."
                                value={formData.excerpt}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                                }
                                rows={3}
                                className="text-sm sm:text-base"
                            />
                            <p className="text-xs sm:text-sm text-gray-500">
                                {formData.excerpt.length} characters
                            </p>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label htmlFor="tags">
                                <Tag className="h-4 w-4 inline mr-2" />
                                Tags
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    placeholder="Add a tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                />
                                <Button onClick={handleAddTag} variant="outline">
                                    Add
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-2 hover:text-red-500"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Content Editor */}
                        <div className="space-y-2">
                            <Label>Newsletter Content *</Label>
                            <RichTextEditor
                                content={formData.content}
                                onChange={(content: string) =>
                                    setFormData((prev) => ({ ...prev, content }))
                                }
                                placeholder="Start writing your newsletter content here... Use the toolbar above to format text, add images, links, and more."
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="preview">
                        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
                            {/* Preview Header */}
                            {formData.thumbnail && (
                                <img
                                    src={formData.thumbnail}
                                    alt={formData.title}
                                    className="w-full h-64 object-cover rounded-lg mb-6"
                                />
                            )}

                            {/* Title */}
                            <h1 className="text-5xl font-bold mb-4 font-newsreader">
                                {formData.title || 'Untitled Newsletter'}
                            </h1>

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                                {user?.displayName && <span>By {user.displayName}</span>}
                            </div>

                            {/* Tags */}
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {formData.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <Separator className="my-6" />

                            {/* Excerpt */}
                            {formData.excerpt && (
                                <p className="text-xl text-gray-700 italic mb-8">
                                    {formData.excerpt}
                                </p>
                            )}

                            {/* Content */}
                            <div
                                className="newsletter-content"
                                dangerouslySetInnerHTML={{ __html: formData.content }}
                            />

                            {!formData.content && (
                                <p className="text-gray-400 text-center py-12">
                                    No content to preview. Start writing in the editor!
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <Footer />
        </div>
    );
}

export default function AdminPostPage() {
    return (
        <AdminPostContent />
    );
}
