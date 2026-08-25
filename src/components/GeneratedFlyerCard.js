'use client';

import markerColors, { CATEGORY_ABBREV } from '@/lib/markerColors';
import { normalizeType } from '@/lib/normalize';
import { formatDate } from '@/lib/date';

// Used whenever an event has no flyer_image_url/image_url. No image
// dependency — built entirely from data already on the event/space record,
// so there's always a working end state instead of a broken image or blank
// space.
//
// Color/abbreviation come from the event's SPACE category, not the event's
// own category: event categories (exhibition, concert, workshop...) and
// space categories (bar, club, museum...) are two different vocabularies —
// markerColors/CATEGORY_ABBREV are keyed by space category only, so an
// event's own category can't be looked up in that mapping directly.
export default function GeneratedFlyerCard({ event, spaceCategory, className = '' }) {
  const typeKey = normalizeType(spaceCategory) || 'other';
  const color = markerColors[typeKey] || markerColors.other;
  const abbrev = CATEGORY_ABBREV[typeKey] || CATEGORY_ABBREV.other;
  const dateLabel = formatDate(event?.start_date);
  const title = event?.title || 'Untitled event';

  return (
    <div
      className={`flex aspect-[4/3] w-full flex-col justify-between overflow-hidden rounded-2xl p-5 ${className}`.trim()}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 22%, var(--background) 78%)`,
        border: `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
      }}>
      <span
        className='inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.24em]'
        style={{
          backgroundColor: `color-mix(in oklab, ${color} 55%, var(--background) 45%)`,
          color: 'var(--foreground)',
        }}>
        {abbrev}
      </span>

      <div className='space-y-2'>
        <p className='line-clamp-3 text-base font-medium leading-snug text-[var(--foreground)]'>
          {title}
        </p>
        {dateLabel && (
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-[var(--foreground)]/70'>
            {dateLabel}
          </p>
        )}
      </div>
    </div>
  );
}
