import { useMemo, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional folder to upload inline images to in the media library */
  imageUploadFolder?: string;
  /** Optional order/project id to tag inline image uploads with */
  imageUploadOrderId?: string;
}

/**
 * Rich text editor based on Quill, configured with **email-safe** formats only.
 *
 * Removed because they don't render reliably across email clients (Outlook,
 * Gmail mobile, Apple Mail):
 *   - headers (h1/h2/h3) — Outlook collapses margins, breaks layout
 *   - background color — Outlook strips it
 *   - strike — inconsistent rendering
 *
 * Inline images are uploaded to the media library (Cloudinary) and embedded
 * as `<img src="https://...">` so they survive email forwarding/quoting.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  imageUploadFolder = 'email-inline',
  imageUploadOrderId,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();

  // Custom image handler: upload to Cloudinary via media library, then embed URL
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Quick client-side size guard (5MB) so we don't waste time uploading huge files
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Image too large',
          description: 'Inline images must be under 5MB. Use an attachment for larger files.',
          variant: 'destructive',
        });
        return;
      }

      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      // Insert a placeholder so the user sees something while uploading
      const range = editor.getSelection(true);
      editor.insertText(range.index, 'Uploading image…', 'italic', true);

      try {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('folder', imageUploadFolder);
        formData.append('category', 'email-inline');
        if (imageUploadOrderId) formData.append('orderId', imageUploadOrderId);

        const res = await fetch('/api/media-library/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!res.ok) throw new Error(await res.text());
        const items = await res.json();
        const url = items?.[0]?.cloudinaryUrl;
        if (!url) throw new Error('Upload returned no URL');

        // Remove placeholder and insert the image
        editor.deleteText(range.index, 'Uploading image…'.length);
        editor.insertEmbed(range.index, 'image', url, 'user');
        editor.setSelection(range.index + 1, 0);
      } catch (err: any) {
        // Roll back the placeholder
        try { editor.deleteText(range.index, 'Uploading image…'.length); } catch {}
        toast({
          title: 'Image upload failed',
          description: err?.message || 'Could not upload inline image',
          variant: 'destructive',
        });
      }
    };
  }, [imageUploadFolder, imageUploadOrderId, toast]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ color: [] }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler,
        },
      },
      clipboard: {
        // Strip formatting on paste so users don't drag in unsupported HTML
        matchVisual: false,
      },
    }),
    [imageHandler],
  );

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'color',
    'link', 'image',
  ];

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
      />
    </div>
  );
}
