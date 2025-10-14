// src/app/events/[id]/EventPageClient.js
'use client';

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import Spinner from '@/components/Spinner';
import ShareButton from '@/components/ShareButton';
import AddToCalendar from '@/components/AddToCalendar';
import MapComponent from '@/components/MapComponent';
import { FilterContext } from '@/contexts/FilterContext';
import { formatDateRange } from '@/lib/date';

export default function EventPageClient({ eventId }) {
  const router = useRouter();
  const { setSelectedFilters } = useContext(FilterContext);

  const [event, setEvent] = useState(null);
  const [spaceAddress, setSpaceAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        setEvent(data);

        if (
          data?.space &&
          !data.space.address &&
          data.space.latitude &&
          data.space.longitude
        ) {
          try {
            const geoRes = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${data.space.longitude},${data.space.latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
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
      });
      router.push(buildFilterHref(filters));
    },
    [router, setSelectedFilters]
  );

  const startDate = event?.start_date ? event.start_date.slice(0, 10) : null;
  const city =
    event?.space?.city || event?.city || event?.space_city || event?.location || '';
  const venueName = event?.space?.name || event?.venue || '';
  const spaceHref = event?.space
    ? `/spaces/${event.space.slug || event.space.id}`
    : null;
  const eventCategory = event?.category || '';
  const eventDesigner = event?.designer || '';
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
  const eventUrl = event?.slug ? `/events/${event.slug}` : `/events/${event?.id}`;
  const statusLabel = getEventStatus(event);
  const hasMap = Boolean(
    event?.latitude ||
      event?.longitude ||
      event?.space?.latitude ||
      event?.space?.longitude
  );

  const infoRows = useMemo(() => {
    if (!event) return [];

    const rows = [];

    if (startDate && eventDateTime) {
      rows.push({
        id: 'info-date',
        label: 'When',
        value: eventDateTime,
        filters: { date: [startDate] },
      });
    }

    if (eventCategory) {
      rows.push({
        id: 'info-category',
        label: 'Category',
        value: eventCategory,
        filters: { category: [eventCategory] },
      });
    }

    if (venueName) {
      rows.push({
        id: 'info-space',
        label: 'Space',
        value: venueName,
        href: spaceHref,
      });
    }

    const addressValue =
      event.space?.address ||
      spaceAddress ||
      event.space?.city ||
      event.city ||
      '';
    if (addressValue) {
      rows.push({
        id: 'info-location',
        label: 'Location',
        value: addressValue,
        externalHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          addressValue
        )}`,
      });
    }

    return rows;
  }, [event, startDate, eventDateTime, eventCategory, venueName, spaceHref, spaceAddress, eventDesigner]);

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
    event.space?.city ||
    event.city ||
    'UNKNOWN ADDRESS';

  const calendarLocation = [
    event.space?.name,
    event.space?.address || spaceAddress,
    event.space?.city,
  ]
    .filter(Boolean)
    .join(', ');

  const flyerSrc = buildOptimizedSrc(event.image_url, 1600);

  return (
    <div className='event-page mx-auto w-full max-w-6xl lg:max-w-5xl px-4 py-8'>
      <header className='event-page__header space-y-4'>
        <div className='flex flex-wrap items-center gap-3'>
          {statusLabel && (
            <span className='list-card__badge quick-view__badge'>{statusLabel}</span>
          )}
        </div>
        <h1 className='quick-view__title event-page__title'>{eventTitle}</h1>
      </header>

      <div className='event-page__layout'>
        <div className='event-page__media'>
          {event.image_url ? (
            <div className='quick-view__poster event-page__poster'>
              <Image
                src={flyerSrc}
                alt={`Flyer for ${eventTitle}`}
                width={1600}
                height={2000}
                sizes='(max-width: 768px) 100vw, 50vw'
                priority
                className='quick-view__poster-image'
              />
            </div>
          ) : (
            <div className='quick-view__poster quick-view__poster--empty event-page__poster'>
              <span>No flyer available</span>
            </div>
          )}
          {eventDesigner && (
            <div className='quick-view__designer-row'>
              <span className='quick-view__designer'>Graphic design by {eventDesigner}</span>
            </div>
          )}

          {hasMap && (
            <div className='event-page__map-card event-page__map-card--media'>
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

        <div className='event-page__details'>
          <div className='event-page__actions'>
            <ShareButton
              title={eventTitle}
              text={shareSummary}
              url={eventUrl}
              imageUrl={event.image_url}
              className='nav-action'
              buttonText='Share'
              copiedText='Copied'
            />
            <AddToCalendar
              event={event}
              overrides={{ location: calendarLocation }}
              className='event-page__calendar'
            />
          </div>

          {infoRows.length > 0 && (
            <div className='event-page__info-grid'>
              {infoRows.map(({ id, label, value, filters, href, externalHref }) => (
                <div
                  key={id}
                  className='event-page__info-item'>
                  <span className='event-page__info-label'>{label}</span>
                  {filters ? (
                    <button
                      type='button'
                      className='event-page__info-link'
                      onClick={() => applyFiltersAndNavigate(filters)}>
                      {value}
                    </button>
                  ) : href ? (
                    <Link
                      href={href}
                      className='event-page__info-link'>
                      {value}
                    </Link>
                  ) : externalHref ? (
                    <a
                      href={externalHref}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='event-page__info-link'>
                      {value}
                    </a>
                  ) : (
                    <span className='event-page__info-value'>{value}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {event.description && (
            <div className='event-page__description'>
              <p className='whitespace-pre-line'>{event.description}</p>
            </div>
          )}

          {hasMap && (
            <div className='event-page__map-card event-page__map-card--details'>
              <MapComponent
                spaces={event.space ? [event.space] : undefined}
                eventId={eventId}
                autoFit
                showPopups={false}
                focusSpaceId={event.space?.id}
              />
            </div>
          )}

          {event.document_url && (
            <a
              href={event.document_url}
              target='_blank'
              rel='noopener noreferrer'
              className='event-page__info-link'>
              Download PDF
            </a>
          )}
        </div>
      </div>
      <div className='event-page__footer-links'>
        <Link
          href='/events'
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
