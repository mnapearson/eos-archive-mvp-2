'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { formatDateRange } from '@/lib/date';

const VIEW_MODES = {
  FLOW: 'flow',
  GRID: 'grid',
  LIST: 'list',
};

const tileVariants = [
  'aspect-[4/5]',
  'aspect-square',
  'aspect-[3/4]',
  'aspect-[5/4]',
  'aspect-[16/11]',
];
const gridColumns = {
  default: 5,
  1600: 4,
  1100: 3,
  768: 2,
};

export default function MasonryGrid({ items = [], fetchMoreData, hasMore }) {
  const [mode, setMode] = useState(VIEW_MODES.GRID);
  const [flowPaused, setFlowPaused] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!hasMore || !fetchMoreData) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || isFetching) return;

        setIsFetching(true);
        Promise.resolve(fetchMoreData())
          .catch(() => {})
          .finally(() => setIsFetching(false));
      },
      {
        rootMargin: '1400px 0px 1400px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchMoreData, hasMore, isFetching]);

  useEffect(() => {
    if (mode !== VIEW_MODES.FLOW) {
      setFlowPaused(false);
    }
  }, [mode]);

  if (!items.length) {
    return (
      <section className='space-y-8 py-20'>
        <header className='flex flex-wrap items-center justify-between gap-4'>
          <div className='ea-label ea-label--muted'>Explorer</div>
        </header>
        <p className='text-center text-sm opacity-70'>No events found yet.</p>
        <div ref={loadMoreRef} />
      </section>
    );
  }

  return (
    <section>
      {mode === VIEW_MODES.FLOW ? (
        <FlowView
          items={items}
          paused={flowPaused}
        />
      ) : mode === VIEW_MODES.GRID ? (
        <GridView items={items} />
      ) : (
        <ListView items={items} />
      )}

      <div
        ref={loadMoreRef}
        className='h-10 w-full'
      />
      {isFetching && (
        <p className='ea-label ea-label--faint text-center'>Loading more…</p>
      )}
    </section>
  );
}

function FlowView({ items, paused }) {
  const { duplicated, loops } = useMemo(() => {
    if (!items.length) return { duplicated: [], loops: 0 };
    const loops = Math.max(2, Math.ceil(12 / items.length));
    const duplicated = Array.from({ length: loops }, () => items).flat();
    return { duplicated, loops };
  }, [items]);

  const animationDuration = useMemo(
    () => `${Math.max(28, duplicated.length * 3.2)}s`,
    [duplicated.length]
  );
  const flowDistance = useMemo(
    () => (loops ? `-${((loops - 1) / loops) * 100}%` : '-50%'),
    [loops]
  );

  return (
    <div className='flow-shell'>
      <div
        className='flow-track'
        style={{
          '--flow-duration': animationDuration,
          '--flow-distance': flowDistance,
          animationPlayState: paused ? 'paused' : 'running',
        }}>
        {duplicated.map((item, index) => {
          const href = item?.id ? `/events/${item.id}` : '#';
          const variant =
            index % 7 === 0
              ? 'aspect-[16/9]'
              : tileVariants[index % tileVariants.length];
          const category = item?.category || item?.type || 'Event';
          const city = item?.space_city || item?.city;
          const dateLabel = formatDate(item);

          return (
            <Link
              key={`${item?.id ?? index}-${index}`}
              href={href}
              scroll={false}
              className='flow-card group'>
              <article className={`flow-card__media ${variant}`}>
                <img
                  src={item?.image_url || '/placeholder.jpg'}
                  alt={item?.title || 'Event image'}
                  className='flow-card__image'
                />
                <div className='flow-card__overlay' />
                <div className='flow-card__meta'>
                  <p className='flow-card__kicker'>{category}</p>
                  <p className='flow-card__title'>{item?.title}</p>
                  <p className='flow-card__metafooter'>
                    {[city, dateLabel].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </article>
              <span className='sr-only'>
                {category} · {item?.title}
                {city ? ` · ${city}` : ''}
                {dateLabel ? ` · ${dateLabel}` : ''}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function GridView({ items }) {
  return (
    <div className='grid-shell'>
      <Masonry
        breakpointCols={gridColumns}
        className='grid-shell__masonry'
        columnClassName='grid-shell__column'>
        {items.map((item, index) => {
          const href = item?.id ? `/events/${item.id}` : '#';
          const variant = tileVariants[index % tileVariants.length];

          return (
            <Link
              key={item?.id ?? index}
              href={href}
              scroll={false}
              className='grid-card group'>
              <article className={`grid-card__media ${variant}`}>
                <img
                  src={item?.image_url || '/placeholder.jpg'}
                  alt={item?.title || 'Event image'}
                  className='grid-card__image'
                />
                <div className='grid-card__overlay' />
                <div className='grid-card__meta'>
                  <p className='grid-card__kicker'>
                    {(item?.type || 'Event')?.toString()}
                  </p>
                  <p className='grid-card__title'>{item?.title}</p>
                </div>
              </article>
            </Link>
          );
        })}
      </Masonry>
    </div>
  );
}

function ListView({ items }) {
  return (
    <div className='list-view space-y-4'>
      {items.map((item) => {
        const href = item?.id ? `/events/${item.id}` : '#';
        const dateLabel = formatDate(item);
        const city = item?.space_city || item?.city;
        const designer = item?.designer;
        const category = item?.category;

        return (
          <article
            key={item?.id ?? href}
            className='list-card group border border-[var(--foreground)]/12 bg-[var(--background)]/80 p-4 transition hover:-translate-y-1 hover:border-[var(--foreground)]/30 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center'>
              <Link
                href={href}
                scroll={false}
                className='relative block h-32 w-full overflow-hidden rounded-lg bg-[var(--foreground)]/5 md:h-24 md:w-32'>
                <img
                  src={item?.image_url || '/placeholder.jpg'}
                  alt={item?.title || 'Event image'}
                  className='absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.05]'
                />
                <span className='sr-only'>Open {item?.title}</span>
              </Link>

              <div className='flex-1 space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  {category && (
                    <span className='ea-label ea-label--muted'>{category}</span>
                  )}
                  {designer && (
                    <span className='text-[11px] uppercase tracking-[0.28em] opacity-60'>
                      {designer}
                    </span>
                  )}
                </div>
                <h3 className='text-lg font-semibold leading-tight'>
                  {item?.title}
                </h3>
                <div className='flex flex-wrap gap-4 text-sm opacity-75'>
                  {dateLabel && <span>{dateLabel}</span>}
                  {city && <span>{city}</span>}
                </div>
                <Link
                  href={href}
                  scroll={false}
                  className='nav-action inline-flex'>
                  View event
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function formatDate(event) {
  return formatDateRange(
    event?.start_date,
    event?.end_date,
    event?.start_time,
    event?.end_time
  );
}
