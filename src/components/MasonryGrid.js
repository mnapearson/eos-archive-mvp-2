'use client';

import { useEffect, useRef, useState } from 'react';
import Masonry from 'react-masonry-css';
import EventFeedCard from '@/components/EventFeedCard';

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

const gridColumns = {
  default: 3,
  1200: 3,
  960: 3,
  640: 2,
};

export default function MasonryGrid({
  items = [],
  mode = VIEW_MODES.GRID,
  fetchMoreData,
  hasMore,
  onSelectItem,
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
        <GridView
          items={items}
          onSelectItem={onSelectItem}
        />
      ) : (
        <ListView
          items={items}
          onSelectItem={onSelectItem}
        />
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

function GridView({ items, onSelectItem }) {
  return (
    <div className='grid-shell'>
      <Masonry
        breakpointCols={gridColumns}
        className='grid-shell__masonry'
        columnClassName='grid-shell__column'>
        {items.map((item, index) => (
          <EventFeedCard
            key={item?.id ?? index}
            event={item}
            onSelect={onSelectItem}
            className='event-feed-card--grid'
          />
        ))}
      </Masonry>
    </div>
  );
}

function ListView({ items, onSelectItem }) {
  return (
    <div className='list-view space-y-4'>
      {items.map((item, index) => (
        <EventFeedCard
          key={item?.id ?? index}
          event={item}
          onSelect={onSelectItem}
          className='event-feed-card--list'
        />
      ))}
    </div>
  );
}
