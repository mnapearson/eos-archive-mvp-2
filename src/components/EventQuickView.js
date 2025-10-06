'use client';
import { useEffect, useState } from 'react';
import EAImage from '@/components/EAImage';
import { formatDateRange } from '@/lib/date';
import ShareButton from '@/components/ShareButton';
import AddToCalendar from '@/components/AddToCalendar';
import MapComponent from '@/components/MapComponent';

export default function EventQuickView({ event }) {
  const [details, setDetails] = useState(event);
  const title = details?.title ?? 'Event';
  const flyer =
    details?.image_url || details?.flyer_url || details?.thumbnail_url || '';

  // Prefer nested space fields when available; broaden fallbacks
  const venue =
    details?.space?.name ||
    details?.space_name ||
    details?.venue ||
    details?.location ||
    null;
  const address =
    details?.space?.address ||
    details?.address ||
    details?.space_address ||
    details?.street ||
    null;
  const city =
    details?.space?.city || details?.city || details?.space_city || null;
  const locationStr = [venue, address, city].filter(Boolean).join(', ');
  const spaceId = details?.space?.id || null;
  const spaceName = details?.space?.name || null;

  // Dates
  const start = details?.start_date || null;
  const end = details?.end_date || null;
  const startTime = details?.start_time || details?.time || null;
  const endTime = details?.end_time || null;
  const when = start ? formatDateRange(start, end, startTime, endTime) : null;

  const eventHref = `/events/${details?.slug ?? details?.id ?? ''}`;
  const shareSummary = [when, locationStr].filter(Boolean).join(' · ');

  // If location is missing but we have an id, fetch the joined event from the API
  useEffect(() => {
    const needsLocation = !venue && !address && !city;
    if (!needsLocation || !details?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/events/${details.id}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data) setDetails((prev) => ({ ...prev, ...data }));
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [details?.id, venue, address, city]);

  return (
    <div>
      {/* Title */}
      <h2 className='text-base text-lg font-medium tracking-tight'>{title}</h2>

      {/* Flyer image (contained) */}
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

      {/* Location then Date/Time */}
      {(venue || address || city) && (
        <div className='mt-3 opacity-80'>
          {spaceId && spaceName ? (
            <>
              <a
                href={`/spaces/${spaceId}`}
                className='underline underline-offset-2 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/30 rounded'>
                {spaceName}
              </a>
              {address || city
                ? `, ${[address, city].filter(Boolean).join(', ')}`
                : ''}
            </>
          ) : locationStr ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                locationStr
              )}`}
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-2 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/30 rounded'>
              {locationStr}
            </a>
          ) : (
            <span>{locationStr}</span>
          )}
        </div>
      )}
      {when && <div className='opacity-80'>{when}</div>}

      {/* Description (full) */}
      {details?.description && (
        <div className='mt-3'>
          <p className='whitespace-pre-line'>{details.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className='mt-4 flex flex-wrap items-center gap-2'>
        {eventHref && (
          <a
            href={eventHref}
            className='button'>
            More details
          </a>
        )}
        <ShareButton
          title={title}
          text={shareSummary}
          url={eventHref}
          buttonText='Share'
          className='button'
          variant='' // uses default .button look; adjust later if you add variants
        />
        <AddToCalendar
          event={details}
          overrides={{ location: locationStr }}
        />
      </div>

      {/* Small embedded Map */}
      <div
        className='mt-4 rounded-lg overflow-hidden border'
        style={{
          borderColor:
            'color-mix(in oklab, var(--foreground) 15%, transparent)',
        }}>
        <div className='relative w-full h-56'>
          {details?.space?.latitude || details?.space?.longitude ? (
            <MapComponent
              spaces={[
                {
                  id: details.space.id,
                  name: details.space.name,
                  type: details.space.type,
                  latitude: details.space.latitude,
                  longitude: details.space.longitude,
                  city: details.space.city,
                  address: details.space.address,
                },
              ]}
              showDetails={false}
            />
          ) : (
            <MapComponent
              eventId={details?.id}
              address={address || city || undefined}
              showDetails={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
