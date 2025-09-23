'use client';
import EAImage from '@/components/EAImage';
import { formatDateRange } from '@/lib/date';

export default function EventQuickView({ event }) {
  // ---- Defensive reads -----------------------------------------------------
  const title = event?.title ?? 'Event';
  const flyer =
    event?.image_url || event?.flyer_url || event?.thumbnail_url || '';

  // Prefer nested space fields when available
  const venue = event?.space?.name || event?.space_name || event?.venue || null;
  const address =
    event?.space?.address || event?.address || event?.space_address || null;
  const city = event?.space?.city || event?.city || event?.space_city || null;

  // Dates (hide line entirely if we don't have a start date)
  const start = event?.start_date || null;
  const end = event?.end_date || null;
  const startTime = event?.start_time || event?.time || null;
  const endTime = event?.end_time || null;
  const when = start ? formatDateRange(start, end, startTime, endTime) : null;

  const gmaps =
    address || city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${address ? address + ', ' : ''}${city ?? ''}`
        )}`
      : null;

  const eventHref = `/events/${event?.slug ?? event?.id ?? ''}`;

  return (
    <div className='text-sm'>
      {/* Title */}
      <h2 className='text-base font-medium tracking-tight'>{title}</h2>

      {/* Meta line: date/time · venue */}
      {(when || venue || city) && (
        <div className='mt-1 opacity-80'>
          {when ?? ''}
          {when && (venue || city) ? ' · ' : ''}
          {[venue, city].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Flyer image (contained, not overflowing modal) */}
      {flyer ? (
        <div className='mt-3 relative w-full aspect-[3/4] max-h-[70vh]'>
          <EAImage
            src={flyer}
            alt={title}
            fill
            className='object-contain rounded-md'
            sizes='(max-width: 768px) 92vw, 720px'
          />
        </div>
      ) : (
        <div className='mt-3 w-full h-64 rounded-md bg-neutral-800/40 flex items-center justify-center text-xs opacity-70'>
          No flyer available
        </div>
      )}

      {/* Address */}
      {(address || city) && (
        <div className='mt-3'>
          <span className='opacity-70'>Address: </span>
          {gmaps ? (
            <a
              href={gmaps}
              target='_blank'
              rel='noopener noreferrer'
              className='underline focus-visible:ring-2 focus-visible:ring-white/30 rounded'>
              {address || city}
            </a>
          ) : (
            <span>{address || city}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className='mt-4 flex flex-wrap items-center gap-2'>
        {eventHref && (
          <a
            href={eventHref}
            className='ea-btn ea-btn--ghost'>
            Open event page
          </a>
        )}
      </div>
    </div>
  );
}
