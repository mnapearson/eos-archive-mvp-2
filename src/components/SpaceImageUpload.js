'use client';

import { useMemo, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function SpaceImageUpload({ spaceId }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const resetState = () => {
    setFile(null);
    setPreviewUrl('');
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      const message = 'Please choose a JPG or PNG image.';
      setError(message);
      toast.error(message);
      resetState();
      return;
    }

    if (selected.size > MAX_SIZE_BYTES) {
      const message = 'Image must be smaller than 5MB.';
      setError(message);
      toast.error(message);
      resetState();
      return;
    }

    const objectUrl = URL.createObjectURL(selected);
    setFile(selected);
    setPreviewUrl(objectUrl);
    setError('');
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    resetState();
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${spaceId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('space-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      const message = uploadError.message || 'Error uploading image.';
      setError(message);
      toast.error(message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
      error: publicUrlError,
    } = supabase.storage.from('space-images').getPublicUrl(fileName);

    if (publicUrlError || !publicUrl) {
      const message =
        publicUrlError?.message || 'Unable to retrieve image URL.';
      setError(message);
      toast.error(message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('spaces')
      .update({ image_url: publicUrl })
      .eq('id', spaceId);

    if (updateError) {
      const message = updateError.message || 'Error saving image.';
      setError(message);
      toast.error(message);
    } else {
      toast.success('Space image updated.');
      router.refresh();
      handleRemove();
    }
    setUploading(false);
  };

  return (
    <div className='space-y-4 rounded-3xl bg-[var(--background)]/75 p-5 backdrop-blur-xl'>
      <header className='space-y-2'>
        <span className='ea-label ea-label--muted'>Space image</span>
        <p className='text-xs leading-relaxed text-[var(--foreground)]/60'>
          Upload a JPG or PNG up to 5MB. This image represents your venue across
          the archive.
        </p>
      </header>

      <label
        htmlFor='space-image'
        className='flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--foreground)]/28 bg-[var(--background)]/70 px-4 py-10 text-center transition hover:border-[var(--foreground)]/45 hover:bg-[var(--background)]/80'>
        <span className='ea-label text-[var(--foreground)]/60'>
          Click to select
        </span>
        <span className='text-sm text-[var(--foreground)]/45'>
          JPG or PNG • max 5MB
        </span>
        <input
          id='space-image'
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png'
          onChange={handleFileChange}
          className='hidden'
        />
      </label>

      {previewUrl && (
        <figure className='overflow-hidden rounded-2xl bg-[var(--background)]/65'>
          <img
            src={previewUrl}
            alt='Space preview'
            className='h-48 w-full object-cover'
          />
        </figure>
      )}

      {error && <p className='text-sm text-red-400'>{error}</p>}

      <div className='flex flex-col gap-3 sm:flex-row'>
        <button
          type='button'
          onClick={handleUpload}
          disabled={!file || uploading}
          className='nav-action nav-cta !inline-flex h-10 justify-center px-6 text-[11px] uppercase tracking-[0.32em] shadow-[0_18px_40px_rgba(0,0,0,0.24)] disabled:cursor-not-allowed disabled:opacity-60'>
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        {previewUrl && (
          <button
            type='button'
            onClick={handleRemove}
            className='nav-action !inline-flex h-10 justify-center px-6 text-[11px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35'>
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
