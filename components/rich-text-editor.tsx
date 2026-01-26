'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { toast } from "sonner";
import { useUploadImageMutation } from '@/lib/api';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuButton = ({
    onClick,
    active,
    disabled,
    children,
    title,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
      p-1.5 sm:p-2 rounded hover:bg-gray-100 active:scale-95 transition-all touch-manipulation min-w-8 sm:min-w-9
      ${active ? 'bg-gray-200' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    >
        {children}
    </button>
);

const Toolbar = ({ editor }: { editor: Editor | null }) => {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const { user } = useAuth();
    const [uploadImage, { isLoading: uploading }] = useUploadImageMutation();

    const handleLinkSubmit = useCallback(() => {
        if (linkUrl && editor) {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: linkUrl })
                .run();
            setLinkUrl('');
            setLinkDialogOpen(false);
        }
    }, [linkUrl, editor]);

    const handleImageUpload = useCallback(async () => {
        if (!imageFile || !editor || !user) return;

        try {
            const formData = new FormData();
            formData.append('file', imageFile);

            const result = await uploadImage(formData).unwrap();

            if (result.success && result.data) {
                editor.chain().focus().setImage({ src: result.data.url }).run();
                toast.success('Image uploaded successfully');
                setImageDialogOpen(false);
                setImageFile(null);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload image');
        }
    }, [imageFile, editor, user, uploadImage]);

    if (!editor) return null;

    return (
        <>
            <div className="border-b border-gray-200 p-1.5 sm:p-2 flex flex-wrap gap-0.5 sm:gap-1 overflow-x-auto scrollbar-thin">
                {/* Text formatting */}
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Bold"
                >
                    <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    active={editor.isActive('code')}
                    title="Code"
                >
                    <Code className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Headings */}
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Lists */}
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Alignment */}
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <AlignLeft className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <AlignCenter className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <AlignRight className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    active={editor.isActive({ textAlign: 'justify' })}
                    title="Justify"
                >
                    <AlignJustify className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Insert */}
                <MenuButton
                    onClick={() => setLinkDialogOpen(true)}
                    active={editor.isActive('link')}
                    title="Insert Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => setImageDialogOpen(true)}
                    title="Insert Image"
                >
                    <ImageIcon className="h-4 w-4" />
                </MenuButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Undo/Redo */}
                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </MenuButton>
            </div>

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Insert Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleLinkSubmit();
                                }
                            }}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleLinkSubmit}>Insert</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image Dialog */}
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setImageDialogOpen(false);
                                    setImageFile(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleImageUpload} disabled={!imageFile || uploading}>
                                {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            Image,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Start writing your newsletter...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class:
                    'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px] px-6 py-4',
            },
        },
    });

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Toolbar editor={editor} />
            <div className="overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
