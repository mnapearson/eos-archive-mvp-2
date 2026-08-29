'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/Modal';
import useShareCard from '@/hooks/useShareCard';
import { formatDate, formatTime } from '@/lib/date';

function buildCaption(event, space) {
  const dateTime = [formatDate(event.start_date), formatTime(event.start_time)]
    .filter(Boolean)
    .join(' · ');
  const venue = [space?.name, space?.city_name ?? space?.city].filter(Boolean).join(' · ');
  const href =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${event.slug || event.id}`
      : '';

  return [event.title, dateTime, venue, '', 'Licensed CC BY-NC-SA 4.0', href]
    .filter(Boolean)
    .join('\n');
}

// Hidden on the live site while this feature is still being worked on
// locally — set NEXT_PUBLIC_ENABLE_SHARE_TO_SOCIAL=true in .env.local to
// see it in dev. Checked after the hooks below, not before, so hook call
// order stays identical across renders regardless of the flag.
const SHARE_TO_SOCIAL_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SHARE_TO_SOCIAL === 'true';

export default function ShareToSocial({ event, space, className = '' }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('story');
  const { share, status, cardUrl } = useShareCard(event.id);
  const caption = buildCaption(event, space);

  // Card is generated (and cached) on first request for a given event —
  // pre-warm both formats as soon as the sheet opens instead of waiting
  // for the preview <img> to trigger it, so the preview and the eventual
  // share both hit a warm cache.
  useEffect(() => {
    if (!open) return;
    fetch(cardUrl('story')).catch(() => {});
    fetch(cardUrl('square')).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleShare = async () => {
    try {
      const result = await share(format, caption);
      if (result.method === 'download') {
        toast.success('Card downloaded — attach it in your app of choice.');
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast.error('Could not share this card right now.');
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      toast.success('Caption copied.');
    } catch {
      toast.error('Could not copy the caption.');
    }
  };

  if (!SHARE_TO_SOCIAL_ENABLED) return null;

  return (
    <>
      <button type='button' onClick={() => setOpen(true)} className={className}>
        Share to social
      </button>

      <Modal open={open} onClose={() => setOpen(false)} label='Share to social'>
        <div className='space-y-6 p-2'>
          <div>
            <span className='ea-label ea-label--muted'>Share to social</span>
            <h3 className='mt-2 text-lg font-semibold text-[var(--foreground)]'>
              {event.title}
            </h3>
          </div>

          <div className='flex gap-3 text-xs uppercase tracking-[0.24em]'>
            <button
              type='button'
              onClick={() => setFormat('story')}
              className={`nav-action !inline-flex h-9 px-4 ${
                format === 'story'
                  ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                  : ''
              }`}>
              Story 9:16
            </button>
            <button
              type='button'
              onClick={() => setFormat('square')}
              className={`nav-action !inline-flex h-9 px-4 ${
                format === 'square'
                  ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                  : ''
              }`}>
              Square 1:1
            </button>
          </div>

          <div className='flex justify-center rounded-2xl border border-[var(--foreground)]/14 bg-[var(--background)]/70 p-4'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={format}
              src={cardUrl(format)}
              alt={`${event.title} share card preview`}
              className={`rounded-lg ${
                format === 'story' ? 'h-80 w-auto' : 'h-64 w-64 object-cover'
              }`}
            />
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='ea-label ea-label--muted'>Caption</span>
              <button
                type='button'
                onClick={handleCopyCaption}
                className='text-xs uppercase tracking-[0.2em] text-[var(--chrome)] hover:underline'>
                Copy
              </button>
            </div>
            <pre className='whitespace-pre-wrap rounded-2xl border border-[var(--foreground)]/14 bg-[var(--background)]/70 p-4 font-sans text-sm text-[var(--foreground)]/80'>
              {caption}
            </pre>
          </div>

          <button
            type='button'
            onClick={handleShare}
            disabled={status === 'loading'}
            className='nav-action nav-cta !flex h-11 w-full justify-center px-6 text-[12px] uppercase tracking-[0.32em] disabled:cursor-not-allowed disabled:opacity-60'>
            {status === 'loading' ? 'Preparing…' : 'Share'}
          </button>
          <p className='text-center text-xs text-[var(--foreground)]/50'>
            On phones, this opens your share sheet — pick Instagram, Telegram, WhatsApp, or
            anywhere else. On desktop, it downloads the card so you can attach it yourself.
          </p>
        </div>
      </Modal>
    </>
  );
}
