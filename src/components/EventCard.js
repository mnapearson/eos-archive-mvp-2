'use client';

import ShareButton from '@/components/ShareButton';
import { formatDateRange } from '@/lib/date';
import {
  primaryActionClasses,
  subtleActionClasses,
  dangerActionClasses,
  statusBadgeClasses,
} from '@/lib/constants';

export default function EventCard({
  event,
  editable,
  confirmingDelete,
  deleting,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const dateSummary = formatDateRange(
    event.start_date,
    event.end_date,
    event.start_time,
    event.end_time
  );
  const eventSlug = event.slug || event.id;
  const eventHref = eventSlug ? `/events/${eventSlug}` : '';
  const shareSummary = [dateSummary, event.category].filter(Boolean).join(' · ');

  return (
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
              onClick={onEdit}
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

          {confirmingDelete ? (
            <div className='flex w-full flex-col gap-3 rounded-2xl border border-red-500/40 bg-red-500/5 px-4 py-4 sm:w-auto sm:flex-row sm:items-center'>
              <span className='text-sm text-red-300'>
                Remove this event permanently?
              </span>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <button
                  type='button'
                  onClick={onCancelDelete}
                  className={`${subtleActionClasses} w-full sm:w-auto`}>
                  Keep event
                </button>
                <button
                  type='button'
                  onClick={onConfirmDelete}
                  disabled={deleting}
                  className={`${dangerActionClasses} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60`}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type='button'
              onClick={onRequestDelete}
              className={`${dangerActionClasses} w-full sm:w-auto`}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
