'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function normalizeType(type) {
  if (!type) return 'space';
  return String(type).toLowerCase();
}

export default function SpaceListItem({
  space,
  variant = 'compact',
  onFocus,
  isActive = false,
  surface = 'card',
  className = '',
}) {
  const router = useRouter();

  const typeLabel = normalizeType(space.type);
  const cityLabel =
    space.city ||
    space.space_city ||
    space.address ||
    space.space_address ||
    'Unknown location';

  const websiteLabel = useMemo(() => {
    if (!space.website) return null;
    try {
      return new URL(space.website).hostname.replace(/^www\./, '');
    } catch {
      return space.website;
    }
  }, [space.website]);

  const directionsUrl = useMemo(() => {
    const lat = parseFloat(space.latitude ?? space.space_latitude ?? '');
    const lng = parseFloat(space.longitude ?? space.space_longitude ?? '');
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${lat},${lng}`
      )}`;
    }
    const destinationParts = [
      space.address,
      space.space_address,
      space.city,
      space.space_city,
    ].filter(Boolean);
    if (destinationParts.length === 0) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destinationParts.join(', ')
    )}`;
  }, [
    space.latitude,
    space.space_latitude,
    space.longitude,
    space.space_longitude,
    space.address,
    space.space_address,
    space.city,
    space.space_city,
  ]);

  const canFocus = Boolean(onFocus && space.latitude && space.longitude);

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
    return (
      <article
        className={`space-detail-card bg-[var(--background)]/85 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.14)] backdrop-blur-xl ${className}`.trim()}>
        <div className='grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='space-y-5'>
            <header className='space-y-3'>
              <span className='ea-label ea-label--muted'>
                {cityLabel.toUpperCase()}
              </span>
              <h1 className='text-3xl font-semibold tracking-tight text-[var(--foreground)]'>
                {space.name || 'Untitled space'}
              </h1>
              <div className='flex flex-wrap items-center gap-3 text-sm text-[var(--foreground)]/75'>
                <div className='inline-flex items-center gap-2 rounded-full border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/70'>
                  <span className='text-[var(--foreground)]'>
                    {typeLabel || 'other'}
                  </span>
                </div>

                {websiteLabel && (
                  <a
                    href={space.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={handleExternalLinkClick}
                    className='nav-action h-8 rounded-full px-4 text-xs uppercase tracking-[0.28em]'>
                    Visit website
                  </a>
                )}
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={handleExternalLinkClick}
                    className='nav-action h-8 rounded-full px-4 text-xs uppercase tracking-[0.28em]'>
                    Directions
                  </a>
                )}
              </div>
            </header>

            {space.description && (
              <p className='text-sm leading-relaxed text-[var(--foreground)]/85 whitespace-pre-line'>
                {space.description}
              </p>
            )}

            <div className='flex flex-wrap items-center gap-3 text-sm text-[var(--foreground)]/75'>
              {onFocus && space.latitude && space.longitude && (
                <button
                  type='button'
                  onClick={handleFocus}
                  className='nav-action nav-cta h-8 rounded-full px-4 text-xs uppercase tracking-[0.28em]'>
                  View on map
                </button>
              )}
            </div>
          </div>

          {space.image_url && (
            <div className='relative h-[260px] overflow-hidden rounded-3xl border border-[var(--foreground)]/12 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:h-full'>
              <Image
                src={space.image_url}
                alt={space.name || 'Space image'}
                fill
                sizes='(max-width: 768px) 80vw, 360px'
                className='object-cover'
                priority
              />
            </div>
          )}
        </div>
      </article>
    );
  }

  const compactBaseClass = 'space-card group rounded-3xl px-3 py-3 transition';
  const compactSurfaceClass =
    surface === 'overlay'
      ? 'border border-white/70 bg-[rgba(255,255,255,0.92)] text-[#1b1b1b] shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl'
      : 'border border-[var(--foreground)]/12 bg-[var(--background)]/85 shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:border-[var(--foreground)]/28 hover:shadow-[0_20px_48px_rgba(0,0,0,0.16)]';
  const compactActiveClass =
    surface === 'overlay'
      ? isActive
        ? 'bg-white'
        : ''
      : isActive
      ? 'border-[var(--foreground)]/55 bg-[var(--background)] shadow-[0_16px_44px_rgba(0,0,0,0.2)]'
      : '';
  const compactFocusClass = canFocus
    ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/35'
    : '';

  const overlayActionBase =
    'inline-flex h-9 w-full items-center justify-center rounded-full px-3 text-[11px] uppercase tracking-[0.32em] transition';
  const compactPrimaryActionVisual =
    surface === 'overlay'
      ? `${overlayActionBase} bg-[#1b1b1b] text-white shadow-[0_12px_34px_rgba(0,0,0,0.25)] hover:bg-[#1b1b1b]/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b]`
      : 'nav-action nav-cta !inline-flex';
  const compactSecondaryActionVisual =
    surface === 'overlay'
      ? `${overlayActionBase} bg-white/18 text-[#1f1f1f] border border-[#1b1b1b]/25 hover:bg-white/28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b]/30`
      : 'nav-action !inline-flex';
  const compactTertiaryActionVisual =
    surface === 'overlay'
      ? `${overlayActionBase} bg-white/12 text-[#1f1f1f] border border-[#1b1b1b]/20 hover:bg-white/22 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b]/25`
      : 'nav-action !inline-flex';
  const compactActionBase =
    surface === 'overlay'
      ? ''
      : 'h-8 w-full rounded-full px-3 text-[11px] uppercase tracking-[0.32em] sm:w-auto';
  const compactFooterClass =
    surface === 'overlay'
      ? 'mt-3 flex flex-col gap-2'
      : 'mt-3 flex flex-wrap items-center gap-2';

  const titleClass =
    surface === 'overlay'
      ? 'truncate text-base font-semibold text-[#1b1b1b]'
      : 'truncate text-base font-semibold text-[var(--foreground)]';
  const cityClass =
    surface === 'overlay'
      ? 'text-[11px] uppercase tracking-[0.32em] text-[#454545]'
      : 'text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/55';
  const typePillClass =
    surface === 'overlay'
      ? 'shrink-0 rounded-full border border-[#1b1b1b]/25 bg-white/65 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-[#1b1b1b]'
      : 'shrink-0 rounded-full border border-[var(--foreground)]/18 bg-[var(--background)]/70 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/70';

  const compactClasses = [
    compactBaseClass,
    compactSurfaceClass,
    compactActiveClass,
    compactFocusClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={compactClasses}
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
      <header className='flex flex-wrap items-center justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <h3 className={titleClass}>
            {space.name || 'Untitled space'}
          </h3>
          <p className={cityClass}>
            {cityLabel}
          </p>
        </div>
        <span className={typePillClass}>
          {typeLabel}
        </span>
      </header>

      <footer className={compactFooterClass}>
        <button
          type='button'
          onClick={handleNavigate}
          className={`${compactPrimaryActionVisual} ${
            surface === 'overlay' ? '' : compactActionBase
          }`}>
          DETAILS
        </button>
        {directionsUrl && (
          <a
            href={directionsUrl}
            target='_blank'
            rel='noopener noreferrer'
            onClick={handleExternalLinkClick}
            className={`${compactSecondaryActionVisual} ${
              surface === 'overlay' ? '' : compactActionBase
            }`}>
            Directions
          </a>
        )}
        {onFocus && space.latitude && space.longitude && (
          <button
            type='button'
            onClick={handleFocus}
            className={`${compactTertiaryActionVisual} ${
              surface === 'overlay' ? '' : compactActionBase
            }`}>
            View on map
          </button>
        )}
      </footer>
    </article>
  );
}
