'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';

const VIEW_MODES = {
  FLOW: 'flow',
  GRID: 'grid',
};

const tileVariants = ['aspect-[4/5]', 'aspect-square', 'aspect-[3/4]', 'aspect-[5/4]', 'aspect-[16/11]'];
const gridColumns = {
  default: 5,
  1600: 4,
  1100: 3,
  768: 2,
};

export default function MasonryGrid({ items = [], fetchMoreData, hasMore }) {
  const [mode, setMode] = useState(VIEW_MODES.FLOW);
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
    <section className='space-y-10 py-20'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <div className='ea-label ea-label--muted'>Explorer</div>
        <div className='flex items-center gap-3'>
          <span className='ea-label ea-label--faint hidden sm:inline'>View</span>
          <div className='gallery-toggle inline-flex rounded-full border border-[var(--foreground)]/15 bg-[var(--background)]/60 p-1 backdrop-blur'>
            <button
              type='button'
              onClick={() => setMode(VIEW_MODES.FLOW)}
              className={`gallery-toggle__btn ea-label ${mode === VIEW_MODES.FLOW ? 'is-active' : ''}`}
              aria-pressed={mode === VIEW_MODES.FLOW}>
              Flow
            </button>
            <button
              type='button'
              onClick={() => setMode(VIEW_MODES.GRID)}
              className={`gallery-toggle__btn ea-label ${mode === VIEW_MODES.GRID ? 'is-active' : ''}`}
              aria-pressed={mode === VIEW_MODES.GRID}>
              Grid
            </button>
          </div>
        </div>
      </header>

      {mode === VIEW_MODES.FLOW ? <FlowView items={items} /> : <GridView items={items} />}

      <div ref={loadMoreRef} className='h-10 w-full' />
      {isFetching && (
        <p className='ea-label ea-label--faint text-center'>Loading more…</p>
      )}
    </section>
  );
}

function FlowView({ items }) {
  const { duplicated, loops } = useMemo(() => {
    if (!items.length) return { duplicated: [], loops: 0 };
    const loops = Math.max(2, Math.ceil(12 / items.length));
    const duplicated = Array.from({ length: loops }, () => items).flat();
    return { duplicated, loops };
  }, [items]);

  const animationDuration = useMemo(() => `${Math.max(28, duplicated.length * 3.2)}s`, [duplicated.length]);
  const flowDistance = useMemo(() => (loops ? `-${((loops - 1) / loops) * 100}%` : '-50%'), [loops]);

  return (
    <div className='flow-shell'>
      <div
        className='flow-track'
        style={{ '--flow-duration': animationDuration, '--flow-distance': flowDistance }}>
        {duplicated.map((item, index) => {
          const href = item?.id ? `/events/${item.id}` : '#';
          const variant = index % 7 === 0 ? 'aspect-[16/9]' : tileVariants[index % tileVariants.length];

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
                  <p className='flow-card__kicker'>{(item?.type || 'Event')?.toString()}</p>
                  <p className='flow-card__title'>{item?.title}</p>
                </div>
              </article>
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
                  <p className='grid-card__kicker'>{(item?.type || 'Event')?.toString()}</p>
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
