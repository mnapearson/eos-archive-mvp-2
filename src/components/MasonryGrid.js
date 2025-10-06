'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { formatDateRange } from '@/lib/date';

const VIEW_MODES = {
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

export default function MasonryGrid({
  items = [],
  mode = VIEW_MODES.GRID,
  fetchMoreData,
  hasMore,
}) {
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
      {mode === VIEW_MODES.GRID ? (
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
