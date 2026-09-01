// src/app/events/[id]/EventPageClient.js
'use client';

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import Spinner from '@/components/Spinner';
import ShareButton from '@/components/ShareButton';
import AddToCalendar from '@/components/AddToCalendar';
import MapComponent from '@/components/MapComponent';
import GeneratedFlyerCard from '@/components/GeneratedFlyerCard';
import { ShareIcon, HeartIcon } from '@/components/Icons';
import { FilterContext } from '@/contexts/FilterContext';
import { formatDateRange } from '@/lib/date';
import useSavedEvents from '@/hooks/useSavedEvents';

export default function EventPageClient({ eventId }) {
  const router = useRouter();
  const { setSelectedFilters } = useContext(FilterContext);
  const { userId, savedIds, toggle: toggleSave } = useSavedEvents();

  const [event, setEvent] = useState(null);
  const [spaceAddress, setSpaceAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [flyerFailed, setFlyerFailed] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      setFlyerFailed(false);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        setEvent(data);

        const spaceLat = data?.space?.latitude ?? data?.space?.lat;
        const spaceLng = data?.space?.longitude ?? data?.space?.lng;
        if (data?.space && !data.space.address && spaceLat && spaceLng) {
          try {
            const geoRes = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${spaceLng},${spaceLat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            const geoData = await geoRes.json();
            setSpaceAddress(
              geoData.features?.[0]?.place_name || 'UNKNOWN ADDRESS'
            );
          } catch {
            setSpaceAddress('UNKNOWN ADDRESS');
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  const applyFiltersAndNavigate = useCallback(
    (filters) => {
      setSelectedFilters({
        city: filters.city ?? [],
        space: filters.space ?? [],
        date: filters.date ?? [],
        category: filters.category ?? [],
        designer: filters.designer ?? [],
      });
      router.push(buildFilterHref(filters));
    },
    [router, setSelectedFilters]
  );

  const startDate = event?.start_date ? event.start_date.slice(0, 10) : null;
  const city =
    event?.space?.city_name ||
    event?.space?.city ||
    event?.city ||
    event?.space_city ||
    event?.location ||
    '';
  const venueName = event?.space?.name || event?.venue || '';
  const spaceHref = event?.space
    ? `/spaces/${event.space.slug || event.space.id}`
    : null;
  const eventCategory = event?.category || '';
  const eventDesigner = event?.designers?.length
    ? event.designers.join(' & ')
    : '';
  const eventDateTime = event
    ? formatDateRange(
        event.start_date,
        event.end_date,
        event.start_time,
        event.end_time
      )
    : '';

  const shareSummary = [eventDateTime, city, venueName]
    .filter(Boolean)
    .join(' · ');
  const eventUrl = event?.slug
    ? `/events/${event.slug}`
    : `/events/${event?.id}`;
  const statusLabel = getEventStatus(event);
  const hasMap = Boolean(
    event?.latitude ||
      event?.longitude ||
      event?.space?.latitude ||
      event?.space?.longitude ||
      event?.space?.lat ||
      event?.space?.lng
  );

  const filterableRows = useMemo(() => {
    if (!event) return [];

    const rows = [];

    if (eventCategory) {
      rows.push({
        id: 'info-category',
        label: 'Category',
        value: eventCategory,
        filters: { category: [eventCategory] },
      });
    }

    return rows;
  }, [event, eventCategory]);

  // Mobile (app/event/[id].tsx) only ever has a single start_date/start_time
  // — one prominent date line plus a "Doors · HH:MM" line. Web events can
  // span a date range, which that format can't express, so multi-day
  // events fall back to the existing compact range string instead.
  const isMultiDay = Boolean(
    event?.end_date && event.end_date !== event.start_date
  );
  const fullDateLabel =
    !isMultiDay && event?.start_date
      ? new Date(`${event.start_date}T00:00:00`).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : eventDateTime;
  const doorsLabel =
    !isMultiDay && event?.start_time
      ? `Doors · ${event.start_time.slice(0, 5)}`
      : null;

  const addressValue =
    event?.space?.address ||
    spaceAddress ||
    event?.space?.city_name ||
    event?.space?.city ||
    event?.city ||
    '';

  if (loading) {
    return (
      <div className='mx-auto w-full max-w-6xl lg:max-w-5xl px-4 py-20 flex justify-center'>
        <Spinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className='mx-auto w-full max-w-6xl lg:max-w-5xl px-4 py-20 text-center text-sm opacity-60'>
        Event not found.
      </div>
    );
  }

  const eventTitle = event.title || 'Untitled';
  const displayedAddress =
    event.space?.address ||
    spaceAddress ||
    event.space?.city_name ||
    event.space?.city ||
    event.city ||
    'UNKNOWN ADDRESS';

  const calendarLocation = [
    event.space?.name,
    event.space?.address || spaceAddress,
    event.space?.city_name || event.space?.city,
  ]
    .filter(Boolean)
    .join(', ');

  const directFlyerUrl = event.image_url || event.flyer_image_url;
  const flyerSrc = buildOptimizedSrc(directFlyerUrl, 1600);
  const hasFlyer = Boolean(directFlyerUrl) && !flyerFailed;

  const isSaved = userId ? savedIds.has(String(event.id)) : false;

  return (
    <div className='event-page mx-auto w-full max-w-6xl lg:max-w-5xl px-4 py-8'>
      <div className='detail-hero'>
        {hasFlyer ? (
          <Image
            src={flyerSrc}
            alt={`Flyer for ${eventTitle}`}
            fill
            sizes='100vw'
            priority
            className='detail-hero__image'
            onError={() => setFlyerFailed(true)}
          />
        ) : (
          <GeneratedFlyerCard
            event={event}
            spaceCategory={event.space?.category || event.space?.type}
            className='absolute inset-0 !h-full !w-full !aspect-auto !rounded-none'
            showText={false}
          />
        )}
        <div
          className='detail-hero__gradient'
          aria-hidden='true'
        />
        {statusLabel && (
          <span className='detail-hero__status'>{statusLabel}</span>
        )}
        <h1 className='detail-hero__name'>{eventTitle}</h1>
        <div className='detail-hero__actions'>
          <ShareButton
            title={eventTitle}
            text={shareSummary}
            url={eventUrl}
            imageUrl={event.image_url}
            className='detail-hero__circle-btn'
            copiedText='✓'
            aria-label='Share event'>
            <ShareIcon />
          </ShareButton>
          {userId && event?.id && (
            <button
              type='button'
              onClick={() => toggleSave(event.id)}
              className='detail-hero__circle-btn'
              aria-label={isSaved ? 'Remove from saved' : 'Save event'}>
              <HeartIcon filled={isSaved} />
            </button>
          )}
        </div>
      </div>

      <div className='event-page__meta-row'>
        {fullDateLabel && (
          <button
            type='button'
            onClick={() => startDate && applyFiltersAndNavigate({ date: [startDate] })}
            className='event-page__meta-date'>
            {fullDateLabel}
          </button>
        )}
        {doorsLabel && <p className='event-page__meta-doors'>{doorsLabel}</p>}
        {city && <p className='detail-hero__meta event-page__meta-city'>{city}</p>}
      </div>

      <div className='space-y-5 pt-5'>
        {filterableRows.map(({ id, label, value, filters, mono }) => (
          <div
            key={id}
            className='space-y-1.5'>
            <span className='ea-label ea-label--muted'>{label}</span>
            <button
              type='button'
              onClick={() => applyFiltersAndNavigate(filters)}
              className={`block text-sm font-semibold text-[var(--foreground)] hover:text-[var(--chrome)] ${mono ? 'font-mono' : ''}`}>
              {value}
            </button>
          </div>
        ))}

        {venueName && (
          <div className='space-y-1.5'>
            <span className='ea-label ea-label--muted'>At</span>
            {spaceHref ? (
              <Link
                href={spaceHref}
                className='event-page__space-row'>
                {venueName}
                <span aria-hidden>→</span>
              </Link>
            ) : (
              <p className='text-sm text-[var(--foreground)]/85'>{venueName}</p>
            )}
          </div>
        )}

        {event.description && (
          <div className='space-y-1.5'>
            <span className='ea-label ea-label--muted'>About</span>
            <p className='text-sm leading-relaxed text-[var(--foreground)]/85 whitespace-pre-line'>
              {event.description}
            </p>
          </div>
        )}

        {event.instagram_post_url && (
          <div className='space-y-1.5'>
            <span className='ea-label ea-label--muted'>Organizer</span>
            <div>
              <a
                href={event.instagram_post_url}
                target='_blank'
                rel='noopener noreferrer'
                className='nav-action rounded-full px-4'>
                Organizer
              </a>
            </div>
          </div>
        )}

        <div className='space-y-1.5'>
          <span className='ea-label ea-label--muted'>Add to calendar</span>
          <AddToCalendar
            event={event}
            overrides={{ location: calendarLocation }}
            className='event-page__calendar'
          />
        </div>

        {(addressValue || hasMap) && (
          <div className='space-y-1.5'>
            <span className='ea-label ea-label--muted'>Location</span>
            {addressValue && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressValue)}`}
                target='_blank'
                rel='noopener noreferrer'
                className='block text-sm text-[var(--foreground)]/85 underline underline-offset-4 hover:text-[var(--foreground)]'>
                {addressValue}
              </a>
            )}
            {hasMap && (
              <div className='event-page__map-card'>
                <MapComponent
                  spaces={event.space ? [event.space] : undefined}
                  eventId={eventId}
                  autoFit
                  showPopups={false}
                  focusSpaceId={event.space?.id}
                />
              </div>
            )}
          </div>
        )}

        {event.document_url && (
          <a
            href={event.document_url}
            target='_blank'
            rel='noopener noreferrer'
            className='nav-action rounded-full px-4'>
            Download PDF
          </a>
        )}

        {eventDesigner && (
          <p className='text-xs text-[var(--foreground)]/55'>
            Graphic design by {eventDesigner}
          </p>
        )}
      </div>

      <div className='event-page__footer-links'>
        <Link
          href='/'
          className='nav-action event-page__back event-page__footer-link'>
          Explore more events →
        </Link>
      </div>
    </div>
  );
}

function buildOptimizedSrc(url, width = 1600) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('supabase.co')) {
      u.searchParams.set('width', String(width));
      u.searchParams.set('quality', '70');
      u.searchParams.set('format', 'webp');
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function getEventStatus(event) {
  const start = parseDateTime(event?.start_date, event?.start_time, 'start');
  const end = parseDateTime(
    event?.end_date || event?.start_date,
    event?.end_time,
    'end'
  );
  if (!start) return '';

  const now = new Date();
  if (start > now) return 'Upcoming';
  if (end && now <= end) return 'Current';
  if (!end && now.toDateString() === start.toDateString()) return 'Current';
  return '';
}

function parseDateTime(date, time, type) {
  if (!date) return null;
  try {
    const isoTime = time
      ? time.length === 5
        ? `${time}:00`
        : time
      : type === 'end'
      ? '23:59:59'
      : '00:00:00';
    const value = new Date(`${date}T${isoTime}`);
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function buildFilterHref(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, values]) => {
    if (!values) return;
    if (Array.isArray(values)) {
      values
        .map((value) => (value != null ? String(value).trim() : ''))
        .filter(Boolean)
        .forEach((value) => params.append(key, value));
    } else if (values != null) {
      const value = String(values).trim();
      if (value) params.append(key, value);
    }
  });

  const query = params.toString();
  return query ? `/?${query}` : '/';
}
