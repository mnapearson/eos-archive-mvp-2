'use client';

import { useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

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

const FLYER_MAX_SIZE_MB = 5;
const DOCUMENT_MAX_SIZE_MB = 10;
const FLYER_MAX_SIZE_BYTES = FLYER_MAX_SIZE_MB * 1024 * 1024;
const DOCUMENT_MAX_SIZE_BYTES = DOCUMENT_MAX_SIZE_MB * 1024 * 1024;

const baseInputClasses =
  'input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25';
const helperTextClasses = 'text-xs leading-relaxed text-[var(--foreground)]/60';
const dropzoneClasses =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--foreground)]/28 bg-[var(--background)]/70 px-4 py-10 text-center transition hover:border-[var(--foreground)]/45 hover:bg-[var(--background)]/80';

const EMPTY_FORM = (spaceId) => ({
  space_id: spaceId || '',
  title: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  category: 'other',
  designer: '',
  description: '',
});

export default function EventSubmissionForm({ spaceId, spaces = [] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [formData, setFormData] = useState(() => EMPTY_FORM(spaceId));
  const [imageFile, setImageFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flyerName, setFlyerName] = useState('');
  const [documentName, setDocumentName] = useState('');

  const flyerInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const spacesList = spaces;
  const currentSpace = spacesList.find((s) => s.id === spaceId);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetFlyerSelection = () => {
    setImageFile(null);
    setFlyerName('');
    if (flyerInputRef.current) {
      flyerInputRef.current.value = '';
    }
  };

  const resetDocumentSelection = () => {
    setDocumentFile(null);
    setDocumentName('');
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (selected.size > FLYER_MAX_SIZE_BYTES) {
      toast.error(`Flyer must be smaller than ${FLYER_MAX_SIZE_MB}MB.`);
      resetFlyerSelection();
      return;
    }

    setImageFile(selected);
    setFlyerName(selected.name);
  };

  const handleDocumentChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (selected.size > DOCUMENT_MAX_SIZE_BYTES) {
      toast.error(`Document must be smaller than ${DOCUMENT_MAX_SIZE_MB}MB.`);
      resetDocumentSelection();
      return;
    }

    setDocumentFile(selected);
    setDocumentName(selected.name);
  };

  const resetForm = () => {
    setFormData((prev) => ({
      ...EMPTY_FORM(spaceId),
      space_id: spaceId || prev.space_id,
    }));
    resetFlyerSelection();
    resetDocumentSelection();
    setAgreed(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const eventSpaceId = spaceId || formData.space_id;

    if (!eventSpaceId) {
      toast.error('Select a space for this event.');
      return;
    }

    if (!agreed) {
      toast.error('You must agree to the Terms and Conditions to submit.');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload an event flyer before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error('Authentication error. Please sign in again.');
        return;
      }

      const { error: upsertProfileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id });
      if (upsertProfileError) {
        console.error('Profile upsert error:', upsertProfileError);
        toast.error('Error preparing your user profile. Please try again.');
        return;
      }

      const dataToInsert = {
        ...formData,
        space_id: eventSpaceId,
        approved: true,
        image_url: null,
        document_url: null,
        terms_accepted: true,
        created_by: user.id,
      };

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const imagePath = `${eventSpaceId}-${Date.now()}.${fileExt}`;

        const { error: storageError } = await supabase.storage
          .from('event-images')
          .upload(imagePath, imageFile);
        if (storageError) {
          console.error('Error uploading image:', storageError);
          toast.error('Error uploading the image.');
          return;
        }

        const { data: publicData, error: urlError } = supabase.storage
          .from('event-images')
          .getPublicUrl(imagePath);
        if (urlError) {
          console.error('Error getting public URL:', urlError);
          toast.error('Error retrieving the image URL.');
          return;
        }
        dataToInsert.image_url = publicData.publicUrl;
      }

      if (documentFile) {
        const docExt =
          documentFile.name.split('.').pop()?.toLowerCase() || 'pdf';
        const documentPath = `${eventSpaceId}-${Date.now()}-document.${docExt}`;

        const { error: docError } = await supabase.storage
          .from('event-documents')
          .upload(documentPath, documentFile);
        if (docError) {
          console.error('Error uploading document:', docError);
          toast.error('Error uploading the document.');
          return;
        }
        const { data: docPublic, error: docUrlError } = supabase.storage
          .from('event-documents')
          .getPublicUrl(documentPath);
        if (docUrlError) {
          console.error('Error getting document URL:', docUrlError);
          toast.error('Error retrieving the document URL.');
          return;
        }
        dataToInsert.document_url = docPublic.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('events')
        .insert([dataToInsert]);
      if (insertError) {
        console.error('Error inserting event:', insertError);
        toast.error('Error submitting your event. Please try again.');
        return;
      }

      toast.success('Event submitted successfully!');
      resetForm();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-8'>
      <header className='space-y-2'>
        <span className='ea-label ea-label--muted'>Publish an event</span>
        <p className='text-sm leading-relaxed text-[var(--foreground)]/70'>
          Share an upcoming programme for your space. Flyers appear instantly on
          your page once submitted, so double-check timings and credits before
          you publish.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className='space-y-10 sm:p-10'>
        <fieldset className='space-y-6'>
          <legend className='ea-label ea-label--muted'>Event overview</legend>
          <div className='grid gap-6 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              {spaceId ? (
                <>
                  <span className='ea-label ea-label--muted'>Space</span>
                  <div className='rounded-2xl border border-[var(--foreground)]/16 bg-[var(--background)]/70 px-4 py-3 text-sm text-[var(--foreground)]/70 shadow-[0_12px_32px_rgba(0,0,0,0.08)]'>
                    {currentSpace?.name || 'This space'}
                  </div>
                  <p className={helperTextClasses}>
                    Events will publish under the{' '}
                    {currentSpace?.name || 'selected'} space profile.
                  </p>
                </>
              ) : (
                <>
                  <label
                    htmlFor='event-space'
                    className='ea-label ea-label--muted'>
                    Space*
                  </label>
                  <select
                    id='event-space'
                    name='space_id'
                    value={formData.space_id}
                    onChange={handleInputChange}
                    required
                    className={baseInputClasses}>
                    <option
                      value=''
                      disabled>
                      Select a space
                    </option>
                    {spacesList.map((space) => (
                      <option
                        key={space.id}
                        value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                  <p className={helperTextClasses}>
                    Choose the venue this programme belongs to.
                  </p>
                </>
              )}
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <label
                htmlFor='event-title'
                className='ea-label ea-label--muted'>
                Event title*
              </label>
              <input
                id='event-title'
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
                htmlFor='event-category'
                className='ea-label ea-label--muted'>
                Category*
              </label>
              <select
                id='event-category'
                name='category'
                value={formData.category}
                onChange={handleInputChange}
                required
                className={baseInputClasses}>
                <option
                  value=''
                  disabled>
                  Select a category
                </option>
                {EVENT_CATEGORIES.map((category) => (
                  <option
                    key={category}
                    value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='event-designer'
                className='ea-label ea-label--muted'>
                Flyer designer*
              </label>
              <input
                id='event-designer'
                type='text'
                name='designer'
                value={formData.designer}
                onChange={handleInputChange}
                required
                placeholder='Credit the graphic designer'
                className={baseInputClasses}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className='space-y-6'>
          <legend className='ea-label ea-label--muted'>Schedule</legend>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <label
                htmlFor='event-start-date'
                className='ea-label ea-label--muted'>
                Start date*
              </label>
              <input
                id='event-start-date'
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
                htmlFor='event-end-date'
                className='ea-label ea-label--muted'>
                End date*
              </label>
              <input
                id='event-end-date'
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
                htmlFor='event-start-time'
                className='ea-label ea-label--muted'>
                Start time*
              </label>
              <input
                id='event-start-time'
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
                htmlFor='event-end-time'
                className='ea-label ea-label--muted'>
                End time*
              </label>
              <input
                id='event-end-time'
                type='time'
                name='end_time'
                value={formData.end_time}
                onChange={handleInputChange}
                required
                className={baseInputClasses}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className='space-y-6'>
          <legend className='ea-label ea-label--muted'>
            Programme details
          </legend>
          <div className='space-y-2'>
            <label
              htmlFor='event-description'
              className='ea-label ea-label--muted'>
              Description
            </label>
            <textarea
              id='event-description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              placeholder='Share context, collaborators, or access notes for the audience.'
              className={baseInputClasses}
            />
            <p className={helperTextClasses}>
              Optional, but helps visitors understand the intent of the event.
            </p>
          </div>
        </fieldset>

        <fieldset className='space-y-6'>
          <legend className='ea-label ea-label--muted'>Assets</legend>
          <div className='grid gap-6 lg:grid-cols-2'>
            <div className='space-y-3'>
              <span className='ea-label ea-label--muted'>Event flyer*</span>
              <label
                htmlFor='event-flyer'
                className={dropzoneClasses}>
                <span className='ea-label text-[var(--foreground)]/70'>
                  Upload flyer
                </span>
                <span className={helperTextClasses}>
                  {flyerName || 'JPG or PNG • max 5MB'}
                </span>
              </label>
              <input
                id='event-flyer'
                ref={flyerInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                required
                className='hidden'
              />
              {flyerName && (
                <div className='flex items-center justify-between gap-4 rounded-2xl border border-[var(--foreground)]/16 bg-[var(--background)]/70 px-4 py-3'>
                  <span className='truncate text-sm text-[var(--foreground)]/70'>
                    {flyerName}
                  </span>
                  <button
                    type='button'
                    onClick={resetFlyerSelection}
                    className='text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/55 transition hover:text-[var(--foreground)]'>
                    Remove
                  </button>
                </div>
              )}
              <p className={helperTextClasses}>
                Flyers appear instantly on your space page after submission.
              </p>
            </div>

            <div className='space-y-3'>
              <span className='ea-label ea-label--muted'>
                Supporting document (optional)
              </span>
              <label
                htmlFor='event-document'
                className={dropzoneClasses}>
                <span className='ea-label text-[var(--foreground)]/70'>
                  Upload PDF
                </span>
                <span className={helperTextClasses}>
                  {documentName || 'Press release or run sheet • max 10MB'}
                </span>
              </label>
              <input
                id='event-document'
                ref={documentInputRef}
                type='file'
                accept='application/pdf'
                onChange={handleDocumentChange}
                className='hidden'
              />
              {documentName && (
                <div className='flex items-center justify-between gap-4 rounded-2xl border border-[var(--foreground)]/16 bg-[var(--background)]/70 px-4 py-3'>
                  <span className='truncate text-sm text-[var(--foreground)]/70'>
                    {documentName}
                  </span>
                  <button
                    type='button'
                    onClick={resetDocumentSelection}
                    className='text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/55 transition hover:text-[var(--foreground)]'>
                    Remove
                  </button>
                </div>
              )}
              <p className={helperTextClasses}>
                Attach press releases or programmes as a single PDF file.
              </p>
            </div>
          </div>
        </fieldset>

        <div className='space-y-4'>
          <div className='rounded-2xl border border-[var(--foreground)]/16 bg-[var(--background)]/70 px-4 py-4'>
            <label className='flex items-start gap-3 text-left'>
              <input
                type='checkbox'
                id='event-terms'
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className='mt-1 h-4 w-4 accent-[var(--foreground)]'
              />
              <span className='text-sm leading-relaxed text-[var(--foreground)]/75'>
                I agree to the{' '}
                <a
                  href='/terms'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline transition hover:text-[var(--foreground)]'>
                  Terms and Conditions
                </a>{' '}
                for publishing events on eos archive.
              </span>
            </label>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <button
              type='submit'
              disabled={submitting}
              className='nav-action nav-cta !inline-flex h-11 w-full justify-center px-8 text-[12px] uppercase tracking-[0.32em] shadow-[0_18px_48px_rgba(0,0,0,0.28)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'>
              {submitting ? 'Submitting…' : 'Submit event'}
            </button>
            <button
              type='button'
              onClick={resetForm}
              className='nav-action !inline-flex h-11 w-full justify-center px-8 text-[12px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35 sm:w-auto'>
              Reset form
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
