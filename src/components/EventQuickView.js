'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const spaceId = details?.space?.id || details?.space_id || null;
  const spaceSlug = details?.space?.slug || details?.space_slug || null;
  const spaceName = details?.space?.name || details?.space_name || null;
  const category =
    details?.category || details?.type || details?.tags?.[0] || null;
  const designer = details?.designer || details?.creator || null;

  const start = details?.start_date || null;
  const end = details?.end_date || null;
  const startTime = details?.start_time || details?.time || null;
  const endTime = details?.end_time || null;
  const when = start ? formatDateRange(start, end, startTime, endTime) : null;
  const startDate = start ? String(start).slice(0, 10) : null;

  const eventHref = `/events/${details?.slug ?? details?.id ?? ''}`;
  const shareSummary = [when, locationStr].filter(Boolean).join(' · ');
  const statusLabel = useMemo(() => getEventStatus(details), [details]);
  const metaChips = useMemo(() => {
    const chips = [];
    const seen = new Set();

    const pushChip = (id, label, href, options = {}) => {
      if (!label || seen.has(label)) return;
      seen.add(label);
      chips.push({ id, label, href, ...options });
    };

    if (startDate && when) {
      pushChip('date', when, buildFilterHref({ date: [startDate] }));
    } else if (when) {
      pushChip('date', when);
    }

    const spaceHref = spaceSlug
      ? `/spaces/${spaceSlug}`
      : spaceId
      ? `/spaces/${spaceId}`
      : null;

    if (spaceHref && spaceName) {
      pushChip('space', spaceName, spaceHref);
    } else if (spaceName) {
      pushChip('space', spaceName);
    }

    if (city) {
      pushChip('city', city, buildFilterHref({ city: [city] }));
    }

    if (address && address !== city) {
      pushChip('address', address);
    }

    if (!spaceHref && !spaceName && locationStr && !seen.has(locationStr)) {
      pushChip('location', locationStr);
    }

    return chips;
  }, [when, startDate, spaceId, spaceName, spaceSlug, city, address, locationStr]);

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
    <section className='quick-view space-y-6'>
      <header className='quick-view__header space-y-3'>
        <div className='quick-view__eyebrow flex items-center gap-3'>
          {category && <span className='ea-label ea-label--muted'>{category}</span>}
          {statusLabel && (
            <span className='list-card__badge quick-view__badge'>{statusLabel}</span>
          )}
        </div>
        <div className='quick-view__title-row'>
          <h2 className='quick-view__title'>{title}</h2>
          {designer && <span className='quick-view__designer'>{designer}</span>}
        </div>
        {metaChips.length > 0 && (
          <div className='quick-view__chips'>
            {metaChips.map(({ id, label, href, external }) =>
              href ? (
                <a
                  key={id}
                  href={href}
                  className='quick-view__chip quick-view__chip--link'
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}>
                  {label}
                </a>
              ) : (
                <span
                  key={id}
                  className='quick-view__chip'>
                  {label}
                </span>
              )
            )}
          </div>
        )}
      </header>

      <div className='quick-view__media'>
        {flyer ? (
          <div className='quick-view__poster'>
            <EAImage
              src={flyer}
              alt={title}
              fill
              className='quick-view__poster-image'
              sizes='(max-width: 768px) 92vw, 720px'
            />
          </div>
        ) : (
          <div className='quick-view__poster quick-view__poster--empty'>
            <span>No flyer available</span>
          </div>
        )}
      </div>

      {details?.description && (
        <div className='quick-view__description'>
          <p className='quick-view__description-text'>{details.description}</p>
        </div>
      )}

      <div className='quick-view__actions'>
        {eventHref && (
          <a
            href={eventHref}
            className='nav-action nav-cta quick-view__action'>
            View full details
          </a>
        )}
        <ShareButton
          title={title}
          text={shareSummary}
          url={eventHref}
          className='nav-action quick-view__action'
          copiedText='Copied'
          buttonText='Share'
        />
        <AddToCalendar
          event={details}
          overrides={{ location: locationStr }}
          className='quick-view__calendar'
        />
      </div>

      <div className='quick-view__map'>
        <div className='quick-view__map-inner'>
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
    </section>
  );
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
  if (start > now) {
    return 'Upcoming';
  }

  if (end && now <= end) {
    return 'Current';
  }

  if (!end && now.toDateString() === start.toDateString()) {
    return 'Current';
  }

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
