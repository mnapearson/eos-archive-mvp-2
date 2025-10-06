'use client';

import { useContext, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterContext } from '@/contexts/FilterContext';
import MasonryGrid from '@/components/MasonryGrid';
import Spinner from '@/components/Spinner';
import Link from 'next/link';
import Modal from '@/components/Modal';
import EventQuickView from '@/components/EventQuickView';
import EAImage from '@/components/EAImage';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedFilters,
    setSelectedFilters,
    filteredEvents,
    filtersLoading,
    recentSpaces,
  } = useContext(FilterContext);
  const [viewMode, setViewMode] = useState('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const searchTermRaw = (searchParams.get('search') || '').trim();
  const searchTermLower = searchTermRaw.toLowerCase();

  const filterLabels = {
    city: 'City',
    space: 'Space',
    date: 'Date',
    category: 'Category',
    designer: 'Designer',
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
      designer: [],
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

  const events = useMemo(() => {
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

    return searched
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filteredEvents, searchTermLower]);

  function handleGridClick(e) {
    const a = e.target?.closest && e.target.closest('a[href^="/events/"]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.button === 1) return; // allow new tab
    e.preventDefault();
    try {
      const href = a.getAttribute('href');
      const url = new URL(href, window.location.origin);
      const slug = url.pathname.split('/').pop();
      const match = (events || []).find(
        (ev) => (ev.slug && ev.slug === slug) || String(ev.id) === slug
      );
      if (match) {
        setSelected(match);
        setModalOpen(true);
      } else {
        window.location.href = href; // fall back if we can’t find it
      }
    } catch {
      // non-standard href, just navigate
      window.location.href = a.href;
    }
  }

  return (
    <div className='w-full'>
      <section
        className='home-hero'
        aria-labelledby='home-hero__title'>
        <p className='home-hero__lead'>Til dawn culture log</p>
        <div className='space-y-4'>
          <h1
            id='home-hero__title'
            className='home-hero__heading'>
            eos—the living archive of event graphics
          </h1>
          <p className='home-hero__body'>
            Discover independent parties, exhibitions, and gatherings through
            the flyers that announced them. Filter by city, designer, or
            mood—then dive into the spaces that keep the scene alive.
          </p>
          <div className='home-hero__actions'>
            <a
              className='home-hero__cta'
              href='#newsletter'>
              Join the newsletter
            </a>
            <a
              className='home-hero__link'
              href='https://eosarchive.app/spaces/signup'>
              Register a space →
            </a>
          </div>
        </div>
      </section>

      <div
        className='filter-rail'
        role='region'
        aria-label='Archive filters'>
        <div
          className='filter-rail__row'
          role='toolbar'
          aria-label='Explorer modes'>
          <div className='flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-[var(--foreground)]/60'>
            <span>Results</span>
            <span className='text-[var(--foreground)]'>
              {events.length} events
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
              <span>Active filters</span>
              <span className='filter-rail__count'>{activeFilterCount}</span>
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
            <span>No filters applied</span>
            <span className='filter-rail__count'>0</span>
          </div>
        )}
      </div>

      {filtersLoading ? (
        <Spinner />
      ) : (
        <div onClickCapture={handleGridClick}>
          <MasonryGrid
            items={events}
            mode={viewMode}
          />
        </div>
      )}

      {recentSpaces?.length > 0 && (
        <section className='mx-auto mt-16 max-w-6xl space-y-6 px-4'>
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
        onClose={() => setModalOpen(false)}
        label='Event quick view'>
        {selected && <EventQuickView event={selected} />}
      </Modal>
    </div>
  );
}
