'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { formatDateRange } from '@/lib/date';
import ShareButton from '@/components/ShareButton';

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
  const handleCardClick = (event, item) => {
    if (typeof onSelectItem !== 'function') return;
    const nativeButton = event?.nativeEvent?.button ?? event?.button;
    if (event?.metaKey || event?.ctrlKey || nativeButton === 1) return;
    event.preventDefault();
    onSelectItem(item);
  };

  const handleCardKeyDown = (event, item) => {
    if (typeof onSelectItem !== 'function') return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelectItem(item);
  };

  return (
    <div className='grid-shell'>
      <Masonry
        breakpointCols={gridColumns}
        className='grid-shell__masonry'
        columnClassName='grid-shell__column'>
        {items.map((item, index) => {
          const href = item?.id ? `/events/${item.id}` : '#';
          const statusLabel = getEventStatus(item);

          return (
            <Link
              key={item?.id ?? index}
              href={href}
              scroll={false}
              className='grid-card group'
              onClick={(event) => handleCardClick(event, item)}
              onKeyDown={(event) => handleCardKeyDown(event, item)}>
              <figure className='grid-card__media'>
                <img
                  src={item?.image_url || '/placeholder.jpg'}
                  alt={item?.title || 'Event image'}
                  className='grid-card__image'
                  loading='lazy'
                />
                {statusLabel && (
                  <span className='grid-card__status'>{statusLabel}</span>
                )}
              </figure>
              <span className='sr-only'>View event {item?.title}</span>
            </Link>
          );
        })}
      </Masonry>
    </div>
  );
}

function ListView({ items, onSelectItem }) {
  const isInteractive = typeof onSelectItem === 'function';

  const previewFromEvent = (event, item) => {
    if (!isInteractive) return false;
    const nativeButton = event?.nativeEvent?.button ?? event?.button;
    if (event?.metaKey || event?.ctrlKey || nativeButton === 1) {
      return false;
    }
    event.preventDefault?.();
    event.stopPropagation?.();
    onSelectItem(item);
    return true;
  };

  const handleArticleClick = (event, item) => {
    if (!isInteractive) return;
    const bypassTarget = event.target.closest('[data-bypass-preview="true"]');
    if (bypassTarget) return;
    previewFromEvent(event, item);
  };

  const handleArticleKeyDown = (event, item) => {
    if (!isInteractive) return;
    const bypassTarget = event.target.closest('[data-bypass-preview="true"]');
    if (bypassTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelectItem(item);
  };

  return (
    <div className='list-view space-y-4'>
      {items.map((item) => {
        const href = item?.id ? `/events/${item.id}` : '#';
        const dateLabel = formatEventDate(item);
        const city = item?.space_city || item?.city;
        const spaceName = item?.space_name || item?.venue;
        const category = item?.category;
        const statusLabel = getEventStatus(item);
        const locationDetails = [dateLabel, city, spaceName].filter(Boolean);
        const descriptionExcerpt = buildDescriptionExcerpt(item?.description);
        const shareSummary = [dateLabel, city, spaceName]
          .filter(Boolean)
          .join(' · ');

        const interactiveProps = isInteractive
          ? {
              onClick: (event) => handleArticleClick(event, item),
              onKeyDown: (event) => handleArticleKeyDown(event, item),
              role: 'button',
              tabIndex: 0,
              'aria-label': `Preview ${item?.title ?? 'event'}`,
            }
          : {};

        const media = isInteractive ? (
          <button
            type='button'
            className='relative block h-32 w-full overflow-hidden rounded-lg bg-[var(--foreground)]/5 md:h-24 md:w-32'
            onClick={(event) => previewFromEvent(event, item)}
            aria-label={`Preview ${item?.title ?? 'event'}`}>
            <img
              src={item?.image_url || '/placeholder.jpg'}
              alt={item?.title || 'Event image'}
              className='absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.05]'
            />
            <span className='sr-only'>Open {item?.title ?? 'event'}</span>
          </button>
        ) : (
          <Link
            href={href}
            scroll={false}
            className='relative block h-32 w-full overflow-hidden rounded-lg bg-[var(--foreground)]/5 md:h-24 md:w-32'>
            <img
              src={item?.image_url || '/placeholder.jpg'}
              alt={item?.title || 'Event image'}
              className='absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.05]'
            />
            <span className='sr-only'>Open {item?.title ?? 'event'}</span>
          </Link>
        );

        return (
          <article
            key={item?.id ?? href}
            className='list-card group border border-[var(--foreground)]/12 bg-[var(--background)]/80 p-4 transition hover:-translate-y-1 hover:border-[var(--foreground)]/30 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]'
            {...interactiveProps}>
            <div className='flex flex-col gap-4 md:flex-row md:items-center'>
              {media}

              <div className='flex-1 space-y-2'>
                <div className='list-card__meta-head'>
                  <div className='list-card__tags'>
                    {category && (
                      <span className='ea-label ea-label--muted'>{category}</span>
                    )}
                  </div>
                  {statusLabel && (
                    <span className='list-card__badge'>{statusLabel}</span>
                  )}
                </div>
                <h3 className='text-lg font-semibold leading-tight'>
                  {item?.title}
                </h3>
                {locationDetails.length > 0 && (
                  <div className='list-card__details'>
                    {locationDetails.map((detail, detailIdx) => (
                      <span
                        key={`${item?.id ?? href}-detail-${detailIdx}`}
                        className='list-card__detail'>
                        {detail}
                      </span>
                    ))}
                  </div>
                )}
                {descriptionExcerpt && (
                  <p className='list-card__description'>{descriptionExcerpt}</p>
                )}
                <div className='list-card__actions'>
                  <Link
                    href={href}
                    scroll={false}
                    className='nav-action inline-flex'
                    data-bypass-preview='true'>
                    View event
                  </Link>
                  <span data-bypass-preview='true'>
                    <ShareButton
                      title={item?.title}
                      text={shareSummary}
                      url={href}
                      className='nav-action list-card__share'
                      buttonText='Share'
                    />
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function formatEventDate(event) {
  return formatDateRange(
    event?.start_date,
    event?.end_date,
    event?.start_time,
    event?.end_time
  );
}

function buildDescriptionExcerpt(description, maxLength = 140) {
  if (!description) return '';
  const trimmed = description.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).replace(/\s+$/, '')}…`;
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
