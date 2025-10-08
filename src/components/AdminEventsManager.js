'use client';

import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import { toast } from 'react-hot-toast';
import { formatDateRange } from '@/lib/date';

const EVENT_CATEGORIES = [
  'exhibition',
  'opening',
  'closing',
  'concert',
  'live music',
  'dj night',
  'day party',
  'festival',
  'performance',
  'workshop',
  'market',
  'film',
  'talk',
  'community',
  'other',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_MAX_SIZE_MB = 5;
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;

const baseInputClasses =
  'input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25';
const textAreaClasses = `${baseInputClasses} min-h-[140px]`;
const helperTextClasses = 'text-xs leading-relaxed text-[var(--foreground)]/60';
const dropzoneClasses =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--foreground)]/28 bg-[var(--background)]/70 px-4 py-10 text-center transition hover:border-[var(--foreground)]/45 hover:bg-[var(--background)]/80';
const actionButtonClasses =
  'nav-action !inline-flex h-11 items-center justify-center px-8 text-[11px] uppercase tracking-[0.28em]';
const primaryActionClasses = `${actionButtonClasses} nav-cta shadow-[0_18px_48px_rgba(0,0,0,0.28)]`;
const subtleActionClasses = `${actionButtonClasses} hover:border-[var(--foreground)]/35`;
const dangerActionClasses = `${actionButtonClasses} border border-red-500 text-red-400 shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:bg-red-500/10`;
const statusBadgeClasses =
  'inline-flex items-center gap-2 rounded-full border border-[var(--foreground)]/14 bg-[var(--background)]/80 px-3 py-1 text-[10px] uppercase tracking-[0.28em]';

export default function AdminEventsManager({
  initialEvents,
  spaceId,
  filter = '',
  editable,
  emptyMessage = 'No events found yet for this space.',
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [events, setEvents] = useState(initialEvents || []);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);

  const gridClass =
    filter === 'pending'
      ? 'grid grid-cols-1 gap-6'
      : 'grid grid-cols-1 gap-6 xl:grid-cols-2';

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;

    async function fetchEvents() {
      try {
        let query = supabase
          .from('events')
          .select('*')
          .eq('space_id', spaceId)
          .order('start_date', { ascending: false })
          .order('start_time', { ascending: false });

        if (filter === 'pending') {
          query = query.eq('approved', false);
        } else if (filter === 'approved') {
          query = query.eq('approved', true);
        }

        const { data, error } = await query;
        if (error) {
          const errorMessage = error.message || JSON.stringify(error);
          console.error('Error fetching events:', errorMessage);
          toast.error('Unable to load events right now.');
          return;
        }

        if (!cancelled && Array.isArray(data)) {
          setEvents(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Unexpected error fetching events:', err);
          toast.error('Unable to load events right now.');
        }
      }
    }

    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [spaceId, filter, supabase]);

  useEffect(() => {
    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  const clearNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImageFile(null);
    setNewImagePreview('');
    setAgreed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetEditState = () => {
    setEditingEventId(null);
    setEditFormData({});
    clearNewImage();
    setSaving(false);
    setAgreed(false);
  };

  const handleEditClick = (event) => {
    setEditingEventId(event.id);
    setEditFormData({
      title: event.title || '',
      start_date: event.start_date || '',
      end_date: event.end_date || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      category: event.category || 'other',
      designer: event.designer || '',
      description: event.description || '',
    });
    clearNewImage();
    setAgreed(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
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

    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    const preview = URL.createObjectURL(file);
    setNewImageFile(file);
    setNewImagePreview(preview);
    setAgreed(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEventId) return;

    if (!editFormData.start_date || !editFormData.end_date) {
      toast.error('Please provide both a start and end date.');
      return;
    }

    if (editFormData.end_date < editFormData.start_date) {
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
        title: editFormData.title?.trim() || '',
        start_date: editFormData.start_date,
        end_date: editFormData.end_date,
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        category: editFormData.category,
        designer: editFormData.designer,
        description: editFormData.description,
        approved: false,
        terms_accepted: true,
      };

      if (newImageFile) {
        const ext = newImageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${spaceId}-${editingEventId}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, newImageFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading new image:', uploadError);
          toast.error('Error uploading the new image.');
          return;
        }

        const { data: publicData, error: publicUrlError } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        if (publicUrlError || !publicData?.publicUrl) {
          console.error(
            'Error retrieving new image URL:',
            publicUrlError || 'No URL'
          );
          toast.error('Unable to retrieve the new image URL.');
          return;
        }

        updatedData.image_url = publicData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('events')
        .update(updatedData)
        .eq('id', editingEventId)
        .eq('space_id', spaceId);

      if (updateError) {
        console.error('Error updating event:', updateError);
        toast.error('Unable to save your changes right now.');
        return;
      }

      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId ? { ...event, ...updatedData } : event
        )
      );

      toast.success('Updates saved. The event is pending approval.');
      router.refresh();
      resetEditState();
    } catch (err) {
      console.error('Unexpected error saving event edits:', err);
      toast.error('Unable to save your changes right now.');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (eventId) => {
    setConfirmingDeleteId(eventId);
  };

  const cancelDelete = () => {
    setConfirmingDeleteId(null);
    setDeletingId(null);
  };

  const confirmDelete = async (eventId) => {
    if (!spaceId) return;
    setDeletingId(eventId);

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('space_id', spaceId);

      if (deleteError) {
        console.error('Error deleting event:', deleteError);
        toast.error('Unable to delete this event right now.');
        return;
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      toast.success('Event deleted.');
      router.refresh();

      if (editingEventId === eventId) {
        resetEditState();
      }
    } catch (err) {
      console.error('Unexpected error deleting event:', err);
      toast.error('Unable to delete this event right now.');
    } finally {
      setDeletingId(null);
      setConfirmingDeleteId(null);
    }
  };

  if (!events.length) {
    return (
      <div className='rounded-3xl border border-[var(--foreground)]/14 bg-[var(--background)]/85 px-6 py-10 text-sm leading-relaxed text-[var(--foreground)]/70 shadow-[0_24px_70px_rgba(0,0,0,0.18)]'>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {events.map((event) => {
        const isEditing = editingEventId === event.id;
        const isConfirmingDelete = confirmingDeleteId === event.id;
        const isDeleting = deletingId === event.id;
        const dateSummary = formatDateRange(
          event.start_date,
          event.end_date,
          event.start_time,
          event.end_time
        );
        const eventSlug = event.slug || event.id;
        const eventHref = eventSlug ? `/events/${eventSlug}` : '';
        const shareSummary = [dateSummary, event.category]
          .filter(Boolean)
          .join(' · ');
        const categoryOptions =
          isEditing &&
          editFormData.category &&
          !EVENT_CATEGORIES.includes(editFormData.category)
            ? [editFormData.category, ...EVENT_CATEGORIES]
            : EVENT_CATEGORIES;

        return (
          <article
            key={event.id}
            className='relative overflow-hidden 
            sm:p-8'>
            <div className='pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl' />

            {isEditing ? (
              <form
                onSubmit={handleSaveEdit}
                className='space-y-8'>
                <header className='space-y-2'>
                  <span className='ea-label ea-label--muted'>
                    Editing event
                  </span>
                  <h3 className='text-lg font-semibold tracking-tight text-[var(--foreground)]'>
                    {event.title}
                  </h3>
                  <p className='text-sm text-[var(--foreground)]/65'>
                    Update the details below. Saving will resubmit the event for
                    approval.
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
                      value={editFormData.title || ''}
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
                      value={editFormData.category || 'other'}
                      onChange={handleInputChange}
                      required
                      className={baseInputClasses}>
                      {categoryOptions.map((category) => (
                        <option
                          key={category}
                          value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
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
                      value={editFormData.start_date || ''}
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
                      value={editFormData.end_date || ''}
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
                      value={editFormData.start_time || ''}
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
                      value={editFormData.end_time || ''}
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
                      value={editFormData.designer || ''}
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
                      value={editFormData.description || ''}
                      onChange={handleInputChange}
                      placeholder='Additional programme context, collaborators, access notes...'
                      className={textAreaClasses}
                    />
                  </div>
                </div>

                <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]'>
                  <div className='space-y-3'>
                    <span className='ea-label ea-label--muted'>
                      Update event image
                    </span>
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
                        onChange={(event) => setAgreed(event.target.checked)}
                        className='mt-1 h-4 w-4 accent-[var(--foreground)]'
                      />
                      <span className='text-sm leading-relaxed text-[var(--foreground)]/75'>
                        I confirm I have the right to upload this artwork and I
                        agree to the{' '}
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
                    onClick={resetEditState}
                    className={`${subtleActionClasses} w-full sm:w-auto`}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className='flex flex-col gap-6 lg:flex-row'>
                <div className='overflow-hidden rounded-3xl border border-[var(--foreground)]/16 bg-[var(--background)]/70 lg:w-64'>
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-full min-h-[240px] items-center justify-center bg-[var(--foreground)]/5 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/40'>
                      No flyer
                    </div>
                  )}
                </div>

                <div className='flex flex-1 flex-col justify-between gap-6'>
                  <div className='space-y-4'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <h3 className='text-xl font-semibold tracking-tight text-[var(--foreground)]'>
                        {event.title}
                      </h3>
                      <span
                        className={`${statusBadgeClasses} ${
                          event.approved
                            ? 'border-emerald-400/50 text-emerald-300'
                            : 'border-amber-400/50 text-amber-300'
                        }`}>
                        {event.approved ? 'Published' : 'Pending'}
                      </span>
                    </div>

                    {dateSummary && (
                      <p className='text-sm leading-relaxed text-[var(--foreground)]/70'>
                        {dateSummary}
                      </p>
                    )}

                    <div className='flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-[var(--foreground)]/60'>
                      {event.category && (
                        <span className='rounded-full border border-[var(--foreground)]/16 px-3 py-1'>
                          {event.category}
                        </span>
                      )}
                      {event.designer && (
                        <span className='rounded-full border border-[var(--foreground)]/16 px-3 py-1'>
                          Graphic design · {event.designer}
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className='text-sm leading-relaxed text-[var(--foreground)]/72'>
                        {event.description}
                      </p>
                    )}

                    {event.document_url && (
                      <a
                        href={event.document_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-2 text-sm text-[var(--foreground)]/70 underline decoration-dotted underline-offset-4 transition hover:text-[var(--foreground)]'>
                        View supporting document
                      </a>
                    )}
                  </div>

                  <div className='flex flex-wrap gap-3'>
                    {editable && (
                      <button
                        type='button'
                        onClick={() => handleEditClick(event)}
                        className={`${primaryActionClasses} w-full sm:w-auto`}>
                        Edit
                      </button>
                    )}

                    <ShareButton
                      title={event.title}
                      text={shareSummary}
                      url={eventHref}
                      buttonText='Share'
                      copiedText='Copied'
                      disabled={!event.approved}
                      className={`${subtleActionClasses} w-full sm:w-auto`}
                    />

                    {isConfirmingDelete ? (
                      <div className='flex w-full flex-col gap-3 rounded-2xl border border-red-500/40 bg-red-500/5 px-4 py-4 sm:w-auto sm:flex-row sm:items-center'>
                        <span className='text-sm text-red-300'>
                          Remove this event permanently?
                        </span>
                        <div className='flex flex-col gap-3 sm:flex-row'>
                          <button
                            type='button'
                            onClick={cancelDelete}
                            className={`${subtleActionClasses} w-full sm:w-auto`}>
                            Keep event
                          </button>
                          <button
                            type='button'
                            onClick={() => confirmDelete(event.id)}
                            disabled={isDeleting}
                            className={`${dangerActionClasses} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60`}>
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={() => requestDelete(event.id)}
                        className={`${dangerActionClasses} w-full sm:w-auto`}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
