'use client';

import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterContext } from '@/contexts/FilterContext';
import MasonryGrid from '@/components/MasonryGrid';
import Spinner from '@/components/Spinner';
import Link from 'next/link';
import Modal from '@/components/Modal';
import EventQuickView from '@/components/EventQuickView';

const EVENT_STATUS_PRIORITY = {
  upcoming: 0,
  current: 1,
  past: 2,
};

const PAST_EVENTS_CHUNK = 24;

function normalizeTime(time, fallback) {
  if (!time) return fallback;
  return time.length === 5 ? `${time}:00` : time;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className='mx-auto w-full max-w-6xl lg:max-w-5xl px-4 py-16 flex justify-center'>
          <Spinner />
        </div>
      }>
      <HomePageContent />
    </Suspense>
  );
}

function parseEventDate(date, time, type) {
  if (!date) return null;
  try {
    const isoTime = normalizeTime(
      time,
      type === 'end' ? '23:59:59' : '00:00:00'
    );
    const value = new Date(`${date}T${isoTime}`);
    return Number.isNaN(value.getTime()) ? null : value;
  } catch (error) {
    return null;
  }
}

function getTemporalInfo(event, reference) {
  const now = reference ?? new Date();
  const start = parseEventDate(event?.start_date, event?.start_time, 'start');
  const end = parseEventDate(
    event?.end_date || event?.start_date,
    event?.end_time,
    'end'
  );

  let status = 'past';
  if (start) {
    if (start > now) {
      status = 'upcoming';
    } else if (now >= start) {
      const isCurrent = end
        ? now <= end
        : now.toDateString() === start.toDateString();
      status = isCurrent ? 'current' : 'past';
    }
  }

  const startMs = start ? start.getTime() : Number.NEGATIVE_INFINITY;
  const endMs = end ? end.getTime() : startMs;
  const createdMs = event?.created_at
    ? new Date(event.created_at).getTime()
    : Number.NEGATIVE_INFINITY;

  return { status, startMs, endMs, createdMs };
}

function compareEventsByTemporalOrder(a, b, reference) {
  const infoA = getTemporalInfo(a, reference);
  const infoB = getTemporalInfo(b, reference);

  const priorityA =
    EVENT_STATUS_PRIORITY[infoA.status] ?? EVENT_STATUS_PRIORITY.past;
  const priorityB =
    EVENT_STATUS_PRIORITY[infoB.status] ?? EVENT_STATUS_PRIORITY.past;
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  if (infoA.status === 'upcoming') {
    return infoA.startMs - infoB.startMs;
  }

  if (infoA.status === 'current') {
    return infoA.endMs - infoB.endMs;
  }

  // Past events: most recent first
  if (infoA.startMs !== infoB.startMs) {
    return infoB.startMs - infoA.startMs;
  }

  return infoB.createdMs - infoA.createdMs;
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedFilters,
    setSelectedFilters,
    filteredEvents,
    filtersLoading,
    recentSpaces,
  } = useContext(FilterContext);
  const [viewMode, setViewMode] = useState('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [suppressPreview, setSuppressPreview] = useState(false);
  const [pastVisibleCount, setPastVisibleCount] = useState(0);

  const searchTermRaw = (searchParams.get('search') || '').trim();
  const searchTermLower = searchTermRaw.toLowerCase();

  const filterLabels = {
    city: 'City',
    space: 'Space',
    date: 'Date',
    category: 'Category',
    search: 'Search',
  };

  const activeFilterPairs = useMemo(() => {
    const pairs = [];
    Object.entries(selectedFilters).forEach(([filterKey, filterValues]) => {
      if (Array.isArray(filterValues) && filterValues.length > 0) {
        filterValues.forEach((val) => {
          pairs.push({ filterKey, val });
        });
      }
    });
    if (searchTermRaw) {
      pairs.push({ filterKey: 'search', val: searchTermRaw });
    }
    return pairs;
  }, [selectedFilters, searchTermRaw]);

  const activeFilterCount = activeFilterPairs.length;
  const hasActiveFilters = activeFilterCount > 0;

  function openFiltersMenu() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('ea:menu-toggle', {
        detail: { open: true, source: 'filter-rail' },
      })
    );
  }

  // Helper function to remove a single value from a multi-select filter
  function removeFilterValue(filterKey, value) {
    if (filterKey === 'search') {
      clearSearch();
      return;
    }
    setSelectedFilters((prev) => {
      const updated = { ...prev };
      // Filter out the clicked value
      const newValues = (updated[filterKey] || []).filter((v) => v !== value);
      updated[filterKey] = newValues;
      return updated;
    });
  }

  function clearAllFilters() {
    setSelectedFilters({
      city: [],
      space: [],
      date: [],
      category: [],
    });
    if (searchTermRaw) {
      clearSearch();
    }
  }

  function clearSearch() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    const query = params.toString();
    router.replace(query ? `/?${query}` : '/', { scroll: false });
  }

  const { activeEvents, pastEvents, totalEvents } = useMemo(() => {
    const base = filteredEvents;

    const searched = !searchTermLower
      ? base
      : base.filter((ev) => {
          const haystack = [
            ev.title,
            ev.category,
            ev.designer,
            ev.city,
            ev.space_city,
            ev.space_name,
            ev.venue,
            ev.description,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(searchTermLower);
        });

    const referenceNow = new Date();
    const sorted = searched
      .slice()
      .sort((a, b) => compareEventsByTemporalOrder(a, b, referenceNow));

    const active = [];
    const past = [];
    sorted.forEach((event) => {
      const { status } = getTemporalInfo(event, referenceNow);
      if (status === 'past') {
        past.push(event);
      } else {
        active.push(event);
      }
    });

    return {
      activeEvents: active,
      pastEvents: past,
      totalEvents: sorted.length,
    };
  }, [filteredEvents, searchTermLower]);

  useEffect(() => {
    if (!suppressPreview) return;
    const timeout = setTimeout(() => setSuppressPreview(false), 220);
    return () => clearTimeout(timeout);
  }, [suppressPreview]);

  const handlePreview = useCallback(
    (eventData) => {
      if (!eventData || suppressPreview) return;
      setSelected(eventData);
      setModalOpen(true);
    },
    [suppressPreview]
  );

  const closePreview = useCallback(() => {
    setSuppressPreview(true);
    setModalOpen(false);
    setSelected(null);
  }, []);

  useEffect(() => {
    const shouldAutoExpand =
      hasActiveFilters || Boolean(searchTermLower) || activeEvents.length === 0;
    const initialCount = shouldAutoExpand
      ? Math.min(pastEvents.length, PAST_EVENTS_CHUNK)
      : 0;
    setPastVisibleCount((prev) =>
      prev === initialCount ? prev : initialCount
    );
  }, [
    filteredEvents,
    searchTermLower,
    hasActiveFilters,
    activeEvents.length,
    pastEvents.length,
  ]);

  const visiblePastCount = Math.min(pastVisibleCount, pastEvents.length);
  const visiblePastEvents =
    visiblePastCount > 0 ? pastEvents.slice(0, visiblePastCount) : [];
  const visibleEvents = activeEvents.concat(visiblePastEvents);
  const hasPastEvents = pastEvents.length > 0;
  const hasHiddenPast = visiblePastCount < pastEvents.length;

  const handleRevealPast = useCallback(() => {
    if (!hasPastEvents) return;
    setPastVisibleCount((prev) => {
      const next = Math.min(pastEvents.length, PAST_EVENTS_CHUNK);
      return prev >= next ? prev : next;
    });
  }, [hasPastEvents, pastEvents.length]);

  const handleLoadMorePast = useCallback(() => {
    if (!hasHiddenPast) return;
    setPastVisibleCount((prev) =>
      Math.min(prev + PAST_EVENTS_CHUNK, pastEvents.length)
    );
  }, [hasHiddenPast, pastEvents.length]);

  return (
    <div className='w-full flex flex-col items-center'>
      <section
        className='home-hero w-full max-w-6xl lg:max-w-5xl'
        aria-labelledby='home-hero__title'>
        <p className='home-hero__lead'>Culture Til dawn </p>
        <div className='space-y-4'>
          <h1
            id='home-hero__title'
            className='home-hero__heading'>
            eos— a living archive of event graphics worldwide
          </h1>
          <p className='home-hero__body'>
            Discover independent parties, exhibitions, and gatherings through
            the flyers that announced them. Filter by city, category, or
            mood—then dive into the spaces that keep the scene alive.
          </p>
          <div className='home-hero__actions'>
            <a
              className='home-hero__cta'
              href='#newsletter'>
              Join the newsletter
            </a>
            <Link
              className='home-hero__link'
              href='/support'>
              Support the archive →
            </Link>
          </div>
        </div>
      </section>

      <div
        className='filter-rail w-full max-w-6xl lg:max-w-5xl px-4'
        role='region'
        aria-label='Archive filters'>
        <div
          className='filter-rail__row'
          role='toolbar'
          aria-label='Explorer modes'>
          <div className='flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-[var(--foreground)]/60'>
            <span>Results</span>
            <span className='text-[var(--foreground)]'>
              {totalEvents} events
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={`nav-action ${viewMode === 'grid' ? 'nav-cta' : ''}`}>
              Grid
            </button>
            <button
              type='button'
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`nav-action ${viewMode === 'list' ? 'nav-cta' : ''}`}>
              List
            </button>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className='filter-rail__chips'>
            <div
              className='filter-rail__summary'
              aria-live='polite'>
              <button
                type='button'
                className='filter-rail__summary-trigger'
                onClick={openFiltersMenu}>
                <span>Active filters</span>
                <span className='filter-rail__count'>{activeFilterCount}</span>
                <span className='sr-only'>Open filters</span>
              </button>
            </div>
            {activeFilterPairs.map(({ filterKey, val }, idx) => {
              const label = filterLabels[filterKey] || filterKey;
              return (
                <button
                  key={`${filterKey}-${val}-${idx}`}
                  type='button'
                  className='filter-chip'
                  onClick={() => removeFilterValue(filterKey, val)}>
                  <span>
                    {label}: {val}
                  </span>
                  <span
                    className='filter-chip__remove'
                    aria-hidden='true'>
                    ×
                  </span>
                  <span className='sr-only'>
                    Remove {label.toLowerCase()} filter {val}
                  </span>
                </button>
              );
            })}
            <button
              type='button'
              className='filter-rail__clear'
              onClick={clearAllFilters}>
              Clear all
            </button>
          </div>
        ) : (
          <div
            className='filter-rail__summary'
            aria-live='polite'>
            <button
              type='button'
              className='filter-rail__summary-trigger'
              onClick={openFiltersMenu}>
              <span>No filters applied</span>
              <span className='filter-rail__count'>0</span>
              <span className='sr-only'>Open filters</span>
            </button>
          </div>
        )}
      </div>

      {filtersLoading ? (
        <div className='w-full max-w-6xl lg:max-w-5xl px-4'>
          <Spinner
            fullscreen={false}
            size={48}
          />
        </div>
      ) : (
        <div className='w-full max-w-6xl lg:max-w-5xl px-4'>
          <MasonryGrid
            items={visibleEvents}
            mode={viewMode}
            onSelectItem={handlePreview}
          />
          {hasPastEvents && (
            <div className='mt-8 flex flex-col items-center gap-3 pb-4 text-center'>
              {visiblePastCount === 0 ? (
                <>
                  <button
                    type='button'
                    onClick={handleRevealPast}
                    className='nav-action px-6 text-[11px] uppercase tracking-[0.32em]'>
                    See past events
                  </button>
                </>
              ) : (
                <>
                  {hasHiddenPast ? (
                    <button
                      type='button'
                      onClick={handleLoadMorePast}
                      className='nav-action px-6 text-[11px] uppercase tracking-[0.32em]'>
                      Load more past events
                    </button>
                  ) : (
                    <span className='text-[10px] uppercase tracking-[0.28em] text-[var(--foreground)]/40'>
                      You’ve reached the end of the archive
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {recentSpaces?.length > 0 && (
        <section className='mx-auto mt-16 w-full max-w-6xl lg:max-w-5xl space-y-6 px-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <span className='ea-label ea-label--muted'>
              Recently added spaces
            </span>
            <Link
              href='/map'
              className='nav-action'>
              Browse map
            </Link>
          </div>
          <div className='grid gap-4 md:grid-cols-3'>
            {recentSpaces.map((space) => (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className='recent-space-card group rounded-2xl border border-[var(--foreground)]/12 bg-[var(--background)]/85 p-4 transition hover:-translate-y-1 hover:border-[var(--foreground)]/30 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]'>
                <div className='ea-label ea-label--muted'>{space.name}</div>
                <p className='mt-1 text-sm opacity-70'>
                  {space.city || 'Unknown city'}
                </p>
                <p className='mt-4 text-xs uppercase tracking-[0.32em] text-[var(--foreground)]/60'>
                  {space.eventCount} event{space.eventCount === 1 ? '' : 's'}{' '}
                  archived
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Modal for quick view */}
      <Modal
        open={modalOpen}
        onClose={closePreview}
        label='Event quick view'>
        {selected && (
          <EventQuickView
            event={selected}
            onClose={closePreview}
          />
        )}
      </Modal>
    </div>
  );
}
