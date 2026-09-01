'use client';

import { useEffect, useMemo, useState } from 'react';
import EAImage from '@/components/EAImage';
import { formatDateRange } from '@/lib/date';
import ShareButton from '@/components/ShareButton';
import AddToCalendar from '@/components/AddToCalendar';
import MapComponent from '@/components/MapComponent';
import markerColors, { getMarkerTextColor } from '@/lib/markerColors';
import { normalizeType } from '@/lib/normalize';
import { mapboxThumbnail } from '@/lib/mapboxStatic';
import useSavedEvents from '@/hooks/useSavedEvents';

export default function EventQuickView({ event, onClose }) {
  const [details, setDetails] = useState(event);
  const { userId, savedIds, toggle: toggleSave } = useSavedEvents();
  const title = details?.title ?? 'Event';
  // image_url is what this app's frontend actually reads (owner-uploaded);
  // flyer_image_url is the Airtable-synced fallback (see EventFlyer.js for
  // the full writeup on this field split). flyer_url/thumbnail_url were
  // dead checks — no such columns exist on the events table, so those were
  // always undefined.
  const flyer = details?.image_url || details?.flyer_image_url || '';
  const instagramPostUrl = details?.instagram_post_url || '';

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

  // The event's own category (exhibition, concert...) and a space's
  // category (bar, club, museum...) are different vocabularies —
  // markerColors/CATEGORY_ABBREV are keyed by space category only, same
  // distinction already established in GeneratedFlyerCard.js/EventFlyer.js.
  const spaceCategory = details?.space?.category || details?.space?.type || null;
  const markerTypeKey = normalizeType(spaceCategory) || 'other';
  const markerColor = markerColors[markerTypeKey] || markerColors.other;
  const markerTextColor = getMarkerTextColor(markerColor);

  const eventLat = details?.space?.latitude ?? details?.space?.lat ?? null;
  const eventLng = details?.space?.longitude ?? details?.space?.lng ?? null;
  const mapThumbnailUrl =
    eventLat != null && eventLng != null
      ? mapboxThumbnail(eventLng, eventLat, markerColor)
      : null;
  // Prefers address over venue/city — venue and city already have their
  // own chips in the pill row above the media area, so repeating either
  // here would just say the same thing twice; the address is the one
  // location detail not already shown anywhere in this modal.
  const mapCaptionText = address || venue || city || null;

  // Static map thumbnail — the modal's fallback when there's no flyer and
  // no Instagram post to embed (also reused as the Instagram embed's own
  // fallback on failure, so a deleted/private post doesn't fall back to a
  // GeneratedFlyerCard that would repeat name/date/category already shown
  // in the pill row above). Genuinely new information for this view: where
  // the event is, not a restatement of what's already on screen.
  const renderMapThumbnail = () => (
    <div className='quick-view__poster relative'>
      {mapThumbnailUrl ? (
        <img
          src={mapThumbnailUrl}
          alt={`Map showing the location of ${title}`}
          className='quick-view__poster-image absolute inset-0 h-full w-full object-cover'
        />
      ) : (
        <div
          className='absolute inset-0'
          style={{
            background: `color-mix(in oklab, ${markerColor} 22%, var(--background) 78%)`,
          }}
        />
      )}
      {mapCaptionText && (
        <span
          className='absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em]'
          style={{
            background: `color-mix(in oklab, ${markerColor} 55%, var(--background) 45%)`,
            color: markerTextColor,
          }}>
          {mapCaptionText}
        </span>
      )}
    </div>
  );

  const designerNames = details?.designers?.length
    ? details.designers
    : details?.creator
    ? [details.creator]
    : [];
  const designer = designerNames.length ? designerNames.join(' & ') : null;

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

    if (category) {
      pushChip('category', category, buildFilterHref({ category: [category] }));
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
    // Also fires when only coordinates are missing, not just when venue/
    // address/city are all absent — the map thumbnail needs lat/lng
    // specifically, which callers that only pass flat space_name/space_city
    // (the Explore homepage grid, the space detail page's event list) never
    // include. Confirmed live: without this, the thumbnail silently
    // rendered a blank tinted box, since venue/city being present already
    // satisfied the original narrower check and skipped this fetch.
    const needsLocation = !venue && !address && !city;
    const needsCoords = eventLat == null && eventLng == null;
    if ((!needsLocation && !needsCoords) || !details?.id) return;
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
  }, [details?.id, venue, address, city, eventLat, eventLng]);

  return (
    <section className='quick-view space-y-6'>
      <header className='quick-view__header space-y-3'>
        {statusLabel && (
          <span className='list-card__badge quick-view__badge quick-view__badge--floating'>
            {statusLabel}
          </span>
        )}
        <div className='quick-view__title-row'>
          <h2 className='quick-view__title'>{title}</h2>
        </div>
        {metaChips.length > 0 && (
          <div className='quick-view__chips'>
            {metaChips.map(({ id, label, href, external }) =>
              href ? (
                <a
                  key={id}
                  href={href}
                  className={`quick-view__chip quick-view__chip--link ${id === 'date' ? 'font-mono' : ''}`}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}>
                  {label}
                </a>
              ) : (
                <span
                  key={id}
                  className={`quick-view__chip ${id === 'date' ? 'font-mono' : ''}`}>
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
          renderMapThumbnail()
        )}
      </div>

      {designer && (
        <div className='quick-view__designer-row'>
          <span className='quick-view__designer'>Graphic design by {designer}</span>
        </div>
      )}

      {details?.description && (
        <div className='quick-view__description'>
          <p className='quick-view__description-text'>{details.description}</p>
        </div>
      )}

      <div className='quick-view__actions'>
        {eventHref && (
          <a
            href={eventHref}
            className='nav-action nav-cta quick-view__action quick-view__action--primary'>
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
        {instagramPostUrl && (
          <a
            href={instagramPostUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='nav-action quick-view__action'>
            Organizer
          </a>
        )}
        {userId && details?.id ? (
          <SaveButton
            isSaved={savedIds.has(String(details.id))}
            onToggle={() => toggleSave(details.id)}
          />
        ) : null}
      </div>

      <div className='quick-view__map'>
        <div className='quick-view__map-inner'>
          {details?.space?.latitude ||
          details?.space?.longitude ||
          details?.space?.lat ||
          details?.space?.lng ? (
            <MapComponent
              spaces={[
                {
                  id: details.space.id,
                  name: details.space.name,
                  type: details.space.type,
                  latitude: details.space.latitude ?? details.space.lat,
                  longitude: details.space.longitude ?? details.space.lng,
                  city: details.space.city_name ?? details.space.city,
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

function SaveButton({ isSaved, onToggle }) {
  return (
    <button
      type='button'
      onClick={onToggle}
      className={`nav-action quick-view__action ${isSaved ? 'border-[var(--chrome)] text-[var(--chrome)] bg-[var(--chrome)]/12' : ''}`}>
      {isSaved ? 'Saved' : 'Save'}
    </button>
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
