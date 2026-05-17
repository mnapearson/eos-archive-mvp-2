'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  EVENT_CATEGORIES,
  ALLOWED_IMAGE_TYPES,
  IMAGE_MAX_SIZE_MB,
  IMAGE_MAX_SIZE_BYTES,
  baseInputClasses,
  textAreaClasses,
  helperTextClasses,
  dropzoneClasses,
  primaryActionClasses,
  subtleActionClasses,
} from '@/lib/constants';

export default function EditEventForm({ event, spaceId, onSaved, onCancel }) {
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    title: event.title || '',
    start_date: event.start_date || '',
    end_date: event.end_date || '',
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    category: event.category || 'other',
    designer: event.designer || '',
    description: event.description || '',
  });

  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    };
  }, [newImagePreview]);

  const clearNewImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(null);
    setNewImagePreview('');
    setAgreed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > IMAGE_MAX_SIZE_BYTES) {
      toast.error(`Image must be smaller than ${IMAGE_MAX_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
    setAgreed(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date) {
      toast.error('Please provide both a start and end date.');
      return;
    }

    if (formData.end_date < formData.start_date) {
      toast.error('End date must be on or after the start date.');
      return;
    }

    if (newImageFile && !agreed) {
      toast.error('Please agree to the Terms before uploading a new image.');
      return;
    }

    setSaving(true);

    try {
      const updatedData = {
        title: formData.title?.trim() || '',
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        category: formData.category,
        designer: formData.designer,
        description: formData.description,
        approved: false,
        terms_accepted: true,
      };

      if (newImageFile) {
        const { data: { session } } = await supabase.auth.getSession();
        const fd = new FormData();
        fd.append('file', newImageFile);
        fd.append('spaceId', spaceId);
        fd.append('eventId', event.id);

        const uploadRes = await fetch('/api/events/upload-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: fd,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          console.error('Error uploading new image:', uploadJson.error);
          toast.error('Error uploading the new image.');
          return;
        }

        updatedData.image_url = uploadJson.url;
      }

      const { error: updateError } = await supabase
        .from('events')
        .update(updatedData)
        .eq('id', event.id)
        .eq('space_id', spaceId);

      if (updateError) {
        console.error('Error updating event:', updateError);
        toast.error('Unable to save your changes right now.');
        return;
      }

      toast.success('Updates saved. The event is pending approval.');
      onSaved({ ...updatedData, id: event.id });
    } catch (err) {
      console.error('Unexpected error saving event edits:', err);
      toast.error('Unable to save your changes right now.');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions =
    formData.category && !EVENT_CATEGORIES.includes(formData.category)
      ? [formData.category, ...EVENT_CATEGORIES]
      : EVENT_CATEGORIES;

  return (
    <form
      onSubmit={handleSave}
      className='space-y-8'>
      <header className='space-y-2'>
        <span className='ea-label ea-label--muted'>Editing event</span>
        <h3 className='text-lg font-semibold tracking-tight text-[var(--foreground)]'>
          {event.title}
        </h3>
        <p className='text-sm text-[var(--foreground)]/65'>
          Update the details below. Saving will resubmit the event for approval.
        </p>
      </header>

      <div className='grid gap-6 sm:grid-cols-2'>
        <div className='space-y-2'>
          <label
            htmlFor={`title-${event.id}`}
            className='ea-label ea-label--muted'>
            Event title*
          </label>
          <input
            id={`title-${event.id}`}
            type='text'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder='Programme name'
            className={baseInputClasses}
          />
        </div>

        <div className='space-y-2'>
          <label
            htmlFor={`category-${event.id}`}
            className='ea-label ea-label--muted'>
            Category*
          </label>
          <select
            id={`category-${event.id}`}
            name='category'
            value={formData.category}
            onChange={handleInputChange}
            required
            className={baseInputClasses}>
            {categoryOptions.map((cat) => (
              <option
                key={cat}
                value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <label
            htmlFor={`start-date-${event.id}`}
            className='ea-label ea-label--muted'>
            Start date*
          </label>
          <input
            id={`start-date-${event.id}`}
            type='date'
            name='start_date'
            value={formData.start_date}
            onChange={handleInputChange}
            required
            className={baseInputClasses}
          />
        </div>

        <div className='space-y-2'>
          <label
            htmlFor={`end-date-${event.id}`}
            className='ea-label ea-label--muted'>
            End date*
          </label>
          <input
            id={`end-date-${event.id}`}
            type='date'
            name='end_date'
            value={formData.end_date}
            onChange={handleInputChange}
            required
            className={baseInputClasses}
          />
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <label
            htmlFor={`start-time-${event.id}`}
            className='ea-label ea-label--muted'>
            Start time*
          </label>
          <input
            id={`start-time-${event.id}`}
            type='time'
            name='start_time'
            value={formData.start_time}
            onChange={handleInputChange}
            required
            className={baseInputClasses}
          />
        </div>

        <div className='space-y-2'>
          <label
            htmlFor={`end-time-${event.id}`}
            className='ea-label ea-label--muted'>
            End time*
          </label>
          <input
            id={`end-time-${event.id}`}
            type='time'
            name='end_time'
            value={formData.end_time}
            onChange={handleInputChange}
            required
            className={baseInputClasses}
          />
        </div>
      </div>

      <div className='grid gap-6 sm:grid-cols-2'>
        <div className='space-y-2'>
          <label
            htmlFor={`designer-${event.id}`}
            className='ea-label ea-label--muted'>
            Flyer designer*
          </label>
          <input
            id={`designer-${event.id}`}
            type='text'
            name='designer'
            value={formData.designer}
            onChange={handleInputChange}
            required
            placeholder='Graphic designer credit'
            className={baseInputClasses}
          />
        </div>

        <div className='space-y-2 sm:col-span-2'>
          <label
            htmlFor={`description-${event.id}`}
            className='ea-label ea-label--muted'>
            Description
          </label>
          <textarea
            id={`description-${event.id}`}
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            placeholder='Additional programme context, collaborators, access notes...'
            className={textAreaClasses}
          />
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]'>
        <div className='space-y-3'>
          <span className='ea-label ea-label--muted'>Update event image</span>
          <label
            htmlFor={`new-image-${event.id}`}
            className={dropzoneClasses}>
            <span className='ea-label text-[var(--foreground)]/70'>
              Upload flyer
            </span>
            <span className={helperTextClasses}>
              JPG, PNG or WEBP • max {IMAGE_MAX_SIZE_MB}MB
            </span>
          </label>
          <input
            id={`new-image-${event.id}`}
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            className='hidden'
          />

          {(newImagePreview || event.image_url) && (
            <figure className='overflow-hidden rounded-2xl border border-[var(--foreground)]/14 bg-[var(--background)]/70'>
              <img
                src={newImagePreview || event.image_url}
                alt={event.title}
                className='h-48 w-full object-cover'
              />
            </figure>
          )}

          {newImagePreview && (
            <button
              type='button'
              onClick={clearNewImage}
              className='text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/55 transition hover:text-[var(--foreground)]'>
              Remove selected image
            </button>
          )}
        </div>

        <div className='space-y-3'>
          {event.document_url && (
            <a
              href={event.document_url}
              target='_blank'
              rel='noopener noreferrer'
              className='block rounded-2xl border border-[var(--foreground)]/16 bg-[var(--background)]/60 px-4 py-4 text-sm text-[var(--foreground)]/70 transition hover:border-[var(--foreground)]/30'>
              Download current document
            </a>
          )}
        </div>
      </div>

      {newImageFile && (
        <div className='rounded-2xl border border-[var(--foreground)]/16 bg-[var(--background)]/70 px-4 py-4'>
          <label className='flex items-start gap-3 text-left'>
            <input
              type='checkbox'
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className='mt-1 h-4 w-4 accent-[var(--foreground)]'
            />
            <span className='text-sm leading-relaxed text-[var(--foreground)]/75'>
              I confirm I have the right to upload this artwork and I agree to
              the{' '}
              <a
                href='/terms'
                target='_blank'
                rel='noopener noreferrer'
                className='underline transition hover:text-[var(--foreground)]'>
                Terms and Conditions
              </a>
              .
            </span>
          </label>
        </div>
      )}

      <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
        <button
          type='submit'
          disabled={saving}
          className={`${primaryActionClasses} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60`}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type='button'
          onClick={onCancel}
          className={`${subtleActionClasses} w-full sm:w-auto`}>
          Cancel
        </button>
      </div>
    </form>
  );
}
