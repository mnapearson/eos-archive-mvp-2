'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { normalizeType } from '@/lib/normalize';
import markerColors, { getMarkerTextColor } from '@/lib/markerColors';
import useSavedSpaces from '@/hooks/useSavedSpaces';
import { getMarkerState } from '@/lib/markerState';
import { formatDate } from '@/lib/date';
import ShareButton from '@/components/ShareButton';
import { ShareIcon, HeartIcon } from '@/components/Icons';
import { mapboxThumbnail } from '@/lib/mapboxStatic';
import MapComponent from '@/components/MapComponent';
import MarkerDot from './MarkerDot';

export default function SpaceListItem({
  space,
  variant = 'compact',
  number,
  onFocus,
  isActive = false,
  className = '',
  showActions = true,
  eventMap = {},
  eventTitleMap = {},
}) {
  const router = useRouter();
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  // image_url is set once a space owner uploads their own photo; until
  // then, fall back to hero_image_url (the Airtable-synced og:image), and
  // finally to a static Mapbox snapshot of the space's location — mirrors
  // mobile's mapboxStaticImage fallback (app/space/[id].tsx) exactly, down
  // to the chrome pin color and zoom level, so a space with no photo at
  // all still gets a real hero image instead of a blank placeholder.
  const spaceLat = parseFloat(space.latitude ?? space.lat ?? space.space_latitude ?? '');
  const spaceLng = parseFloat(space.longitude ?? space.lng ?? space.space_longitude ?? '');
  const displayImageUrl =
    space.image_url ||
    space.hero_image_url ||
    (!Number.isNaN(spaceLat) && !Number.isNaN(spaceLng)
      ? mapboxThumbnail(spaceLng, spaceLat, '7ab4d4', {
          width: 1200,
          height: 630,
          zoom: 13,
        })
      : null);

  useEffect(() => {
    setHeroImageFailed(false);
  }, [displayImageUrl]);

  const typeLabel = normalizeType(space.category || space.type);
  const cityLabel =
    space.city_name ||
    space.city ||
    space.space_city ||
    space.address ||
    space.space_address ||
    'Unknown location';

  const directionsUrl = useMemo(() => {
    if (!Number.isNaN(spaceLat) && !Number.isNaN(spaceLng)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${spaceLat},${spaceLng}`
      )}`;
    }
    const destinationParts = [
      space.address,
      space.space_address,
      space.city_name,
      space.city,
      space.space_city,
    ].filter(Boolean);
    if (destinationParts.length === 0) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destinationParts.join(', ')
    )}`;
  }, [
    spaceLat,
    spaceLng,
    space.address,
    space.space_address,
    space.city_name,
    space.city,
    space.space_city,
  ]);

  const displayAddress = useMemo(() => {
    const addressParts = [
      space.address || space.space_address || '',
      space.city_name || space.city || space.space_city || '',
    ]
      .map((part) => String(part || '').trim())
      .filter(Boolean);

    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }
    return cityLabel;
  }, [
    space.address,
    space.space_address,
    space.city_name,
    space.city,
    space.space_city,
    cityLabel,
  ]);

  const { userId, savedIds, toggle: toggleSave } = useSavedSpaces();
  const canFocus = Boolean(onFocus && !Number.isNaN(spaceLat) && !Number.isNaN(spaceLng));

  const handleFocus = (event) => {
    if (!canFocus) return;
    event?.stopPropagation?.();
    onFocus?.(space);
  };

  const handleNavigate = (event) => {
    event.stopPropagation();
    router.push(`/spaces/${space.id}`);
  };

  const handleExternalLinkClick = (event) => {
    event.stopPropagation();
  };

  if (variant === 'detail') {
    const isSaved = userId ? savedIds.has(String(space.id)) : false;
    const metaLine = [cityLabel, typeLabel].filter(Boolean).join(' · ');

    return (
      <article className={className}>
        <div className='detail-hero'>
          {displayImageUrl && !heroImageFailed ? (
            <Image
              src={displayImageUrl}
              alt={space.name || 'Space image'}
              fill
              sizes='100vw'
              className='detail-hero__image'
              priority
              onError={() => setHeroImageFailed(true)}
            />
          ) : (
            <div className='detail-hero__image detail-hero__image--placeholder' />
          )}
          <div
            className='detail-hero__gradient'
            aria-hidden='true'
          />
          <h1 className='detail-hero__name'>{space.name || 'Untitled space'}</h1>
          <div className='detail-hero__actions'>
            <ShareButton
              title={space.name}
              text={space.name}
              className='detail-hero__circle-btn'
              copiedText='✓'
              aria-label='Share space'>
              <ShareIcon />
            </ShareButton>
            <button
              type='button'
              onClick={() => toggleSave(space.id)}
              className='detail-hero__circle-btn'
              aria-label={isSaved ? 'Remove from saved' : 'Save space'}>
              <HeartIcon filled={isSaved} />
            </button>
          </div>
        </div>

        {metaLine && <p className='detail-hero__meta'>{metaLine}</p>}

        <div className='detail-hero__divider' />

        <div className='space-y-5'>
          {displayAddress && (
            <div className='space-y-2'>
              <span className='ea-label ea-label--muted'>Location</span>
              <p className='text-sm text-[var(--foreground)]/85'>{displayAddress}</p>
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={handleExternalLinkClick}
                  className='detail-text-link inline-block'>
                  Get directions
                </a>
              )}
              {!Number.isNaN(spaceLat) && !Number.isNaN(spaceLng) && (
                <div className='detail-map-card'>
                  <MapComponent
                    spaces={[space]}
                    autoFit
                    focusSpaceId={space.id}
                    showPopups={false}
                  />
                </div>
              )}
            </div>
          )}

          {space.description && (
            <div className='space-y-1.5'>
              <span className='ea-label ea-label--muted'>About</span>
              <p className='text-sm leading-relaxed text-[var(--foreground)]/85 whitespace-pre-line'>
                {space.description}
              </p>
            </div>
          )}
        </div>
      </article>
    );
  }

  const compactBaseClass = 'space-card group rounded-3xl px-3 py-3 transition';
  const compactSurfaceClass =
    'border border-[var(--foreground)]/12 bg-[var(--background)]/85 transition-colors hover:border-[var(--foreground)]/28';
  const compactActiveClass = isActive ? 'border-[var(--chrome)] bg-[var(--chrome-dim)]' : '';
  const compactFocusClass = canFocus
    ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/35'
    : '';

  const compactPrimaryActionVisual = 'nav-action nav-cta !inline-flex';
  const compactTertiaryActionVisual = 'nav-action !inline-flex';
  const compactActionBase = 'w-full rounded-full px-3 sm:w-auto';
  const compactFooterClass = 'mt-3 flex flex-wrap items-center gap-2';

  const titleClass = 'truncate text-base font-semibold text-[var(--foreground)]';
  const cityClass = 'text-[11px] uppercase tracking-[0.04em] text-[var(--foreground)]/55';
  const addressClass = 'mt-0.5 inline-flex text-[11px] text-[var(--foreground)]/65';

  const compactClasses = [
    compactBaseClass,
    compactSurfaceClass,
    compactActiveClass,
    compactFocusClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const typeColor = markerColors[normalizeType(space.category || space.type)] || markerColors.other || '#888';
  const eventState = getMarkerState(space.id, eventMap);
  const nextEventDate = eventMap[space.id];
  const nextEventTitle = eventTitleMap[space.id];

  return (
    <article
      className={compactClasses}
      data-testid='space-card'
      data-space-id={space.id}
      role={canFocus ? 'button' : undefined}
      tabIndex={canFocus ? 0 : undefined}
      onClick={handleFocus}
      aria-pressed={canFocus ? (isActive ? 'true' : 'false') : undefined}
      onKeyDown={(event) => {
        if (!canFocus) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleFocus(event);
        }
      }}>
      <div className='flex items-start gap-3'>
        {typeof number === 'number' && (
          <span
            className='mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold'
            style={{ backgroundColor: typeColor, color: getMarkerTextColor(typeColor) }}>
            {number}
          </span>
        )}
        <div className='min-w-0 flex-1'>
          <h3 className={titleClass}>{space.name || 'Untitled space'}</h3>
          <div className='mt-0.5 flex items-center gap-1.5'>
            <MarkerDot state={eventState} color={typeColor} dotSize={6} ringSize={12} />
            <span className={cityClass}>{typeLabel || 'other'}</span>
          </div>
          {nextEventDate && nextEventTitle && (
            <p className='mt-0.5 truncate text-[11px] text-[var(--foreground)]/55'>
              Next event — <span className='font-mono'>{formatDate(nextEventDate)}</span>, {nextEventTitle}
            </p>
          )}
          {displayAddress && directionsUrl ? (
            <a
              href={directionsUrl}
              target='_blank'
              rel='noopener noreferrer'
              onClick={handleExternalLinkClick}
              className={`${addressClass} underline underline-offset-4 hover:text-[var(--foreground)]`}>
              {displayAddress}
            </a>
          ) : (
            <span className={addressClass}>
              {displayAddress}
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <footer className={compactFooterClass}>
          <button
            type='button'
            onClick={handleNavigate}
            className={`${compactPrimaryActionVisual} ${compactActionBase}`}>
            Details
          </button>
          {onFocus && space.latitude && space.longitude && (
            <button
              type='button'
              onClick={handleFocus}
              className={`${compactTertiaryActionVisual} ${compactActionBase}`}>
              View on map
            </button>
          )}
        </footer>
      )}
    </article>
  );
}

