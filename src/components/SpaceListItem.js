'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function normalizeType(type) {
  if (!type) return 'space';
  return String(type).toLowerCase();
}

function truncate(text, limit = 160) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}

export default function SpaceListItem({
  space,
  variant = 'compact',
  onFocus,
  isActive = false,
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

  const handleFocus = (event) => {
    event.stopPropagation();
    onFocus?.(space);
  };

  const handleNavigate = (event) => {
    event.stopPropagation();
    router.push(`/spaces/${space.id}`);
  };

  if (variant === 'detail') {
    return (
      <article className='space-detail-card bg-[var(--background)]/85 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.14)] backdrop-blur-xl'>
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
                    className='nav-action h-8 rounded-full px-4 text-xs uppercase tracking-[0.28em]'>
                    Visit website
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

  return (
    <article
      className={`space-card group rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/85 px-3 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition hover:-translate-y-1 hover:border-[var(--foreground)]/28 hover:shadow-[0_20px_48px_rgba(0,0,0,0.16)] ${
        isActive ? 'border-[var(--foreground)]/50 bg-[var(--background)]' : ''
      }`}>
      <header className='flex flex-wrap items-center justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-base font-semibold text-[var(--foreground)]'>
            {space.name || 'Untitled space'}
          </h3>
          <p className='text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/55'>
            {cityLabel}
          </p>
        </div>
        <span className='shrink-0 rounded-full border border-[var(--foreground)]/18 bg-[var(--background)]/70 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/70'>
          {typeLabel}
        </span>
      </header>

      <footer className='mt-3 flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={handleNavigate}
          className='nav-action nav-cta h-8 w-full rounded-full px-3 text-[11px] uppercase tracking-[0.32em] sm:w-auto'>
          Details
        </button>
        {onFocus && space.latitude && space.longitude && (
          <button
            type='button'
            onClick={handleFocus}
            className='nav-action h-8 w-full rounded-full px-3 text-[11px] uppercase tracking-[0.32em] sm:w-auto'>
            View on map
          </button>
        )}
      </footer>
    </article>
  );
}
