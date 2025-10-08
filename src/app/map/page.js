'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import SpaceListItem from '@/components/SpaceListItem';
import markerColors from '@/lib/markerColors';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className='w-full h-full bg-[var(--background)]/60' />,
});

function normaliseType(type) {
  if (!type) return 'default';
  return String(type).toLowerCase();
}

function prettifyType(type) {
  if (!type || type === 'default') return 'other';
  return type.replace(/[_-]+/g, ' ').trim();
}

export default function SpacesMapPage() {
  const [spaces, setSpaces] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [focusedSpaceId, setFocusedSpaceId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSpaces() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/spaces');
        if (!res.ok) {
          throw new Error(`Failed to load spaces (${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          setSpaces(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching spaces:', err);
        if (isMounted) {
          setError('Unable to load spaces right now.');
          setSpaces([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSpaces();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersCollapsed = window.matchMedia('(max-width: 768px)').matches;
      setLegendCollapsed(prefersCollapsed);
    }
  }, []);

  const typeFilters = useMemo(() => {
    const counts = new Map();
    spaces.forEach((space) => {
      const key = normaliseType(space.type);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], undefined, { sensitivity: 'base' })
    );
  }, [spaces]);

  const filteredSpaces = useMemo(() => {
    if (!spaces.length) return [];

    const q = searchQuery.trim().toLowerCase();
    const matchesType = (space) => {
      if (activeTypes.length === 0) return true;
      return activeTypes.includes(normaliseType(space.type));
    };
    const matchesQuery = (space) => {
      if (!q) return true;
      const haystack = [space.name, space.city, space.website]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    };

    return spaces.filter((space) => matchesType(space) && matchesQuery(space));
  }, [spaces, activeTypes, searchQuery]);

  const totalCount = filteredSpaces.length;

  useEffect(() => {
    setFocusedSpaceId(null);
  }, [searchQuery, activeTypes]);

  const toggleType = (type) => {
    setActiveTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type);
      }
      return [...prev, type];
    });
  };

  const clearTypes = () => setActiveTypes([]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const hasActiveFilters = activeTypes.length > 0 || searchQuery.trim();

  return (
    <main className='map-page flex min-h-[calc(100vh-72px)] flex-col bg-[var(--background)] lg:flex-row'>
      <section className='order-1 w-full border-b border-[var(--foreground)]/12 px-6 py-6 lg:hidden'>
        <span className='ea-label ea-label--muted text-[var(--foreground)]/70'>
          Spaces archive
        </span>
        <h1 className='mt-3 text-balance text-2xl font-semibold text-[var(--foreground)]'>
          Map of independent scenes
        </h1>
        <p className='mt-2 max-w-xl text-sm leading-relaxed text-[var(--foreground)]/70'>
          Explore the venues, studios, and cultural spaces that power the
          archive. Filter by type, search for a city or name, and dive into the
          map.
        </p>
      </section>

      <section className='relative order-2 h-[48vh] w-full overflow-hidden border-b border-[var(--foreground)]/12 lg:order-2 lg:h-auto lg:flex-1 lg:border-b-0'>
        <MapComponent
          spaces={filteredSpaces}
          activeTypes={activeTypes}
          autoFit
          fitKey={`split-${filteredSpaces.length}`}
          focusSpaceId={focusedSpaceId}
          initialCenter={{ lat: 51.3397, lng: 12.3731 }}
          initialZoom={11}
          onMarkerSelect={setFocusedSpaceId}
        />
      </section>

      <SpacesListPanel
        spaces={filteredSpaces}
        totalCount={totalCount}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearFilters={() => {
          setSearchQuery('');
          clearTypes();
        }}
        hasActiveFilters={hasActiveFilters}
        typeFilters={typeFilters}
        activeTypes={activeTypes}
        toggleType={toggleType}
        legendCollapsed={legendCollapsed}
        setLegendCollapsed={setLegendCollapsed}
        loading={loading}
        error={error}
        onFocus={(space) => setFocusedSpaceId(space?.id ?? null)}
        focusedId={focusedSpaceId}
      />
    </main>
  );
}

function SpacesListPanel({
  spaces,
  totalCount,
  searchQuery,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
  typeFilters,
  activeTypes,
  toggleType,
  legendCollapsed,
  setLegendCollapsed,
  loading,
  error,
  onFocus,
  focusedId,
}) {
  const statusLabel = loading
    ? 'Loading spaces…'
    : error
    ? error
    : `${totalCount} space${totalCount === 1 ? '' : 's'} visible`;

  return (
    <aside className='order-3 flex min-h-[48vh] w-full flex-col border-t border-[var(--foreground)]/12 bg-[var(--background)]/96 backdrop-blur-xl lg:order-1 lg:h-[calc(100vh-72px)] lg:max-w-[520px] lg:border-t-0 lg:border-r lg:border-[var(--foreground)]/12'>
      <div className='hidden border-b border-[var(--foreground)]/12 px-6 py-6 lg:block'>
        <span className='ea-label ea-label--muted text-[var(--foreground)]/70'>
          Spaces archive
        </span>
        <h1 className='mt-3 text-balance text-2xl font-semibold text-[var(--foreground)] sm:text-3xl'>
          Map of independent scenes
        </h1>
        <p className='mt-2 max-w-xl text-sm leading-relaxed text-[var(--foreground)]/70'>
          Explore the venues, studios, and cultural spaces that power the
          archive. Filter by type, search for a city or name, and dive into the
          map.
        </p>
      </div>

      <div className='border-b border-[var(--foreground)]/12 px-6 py-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <form
            role='search'
            onSubmit={(event) => event.preventDefault()}
            className='nav-search nav-search--panel w-full sm:max-w-xs'>
            <input
              type='search'
              value={searchQuery}
              onChange={onSearchChange}
              placeholder='Search by space or city'
              className='nav-search__input text-sm'
              aria-label='Search spaces'
            />
            <button
              type='submit'
              className='nav-search__submit'
              aria-label='Search spaces'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                aria-hidden='true'>
                <path
                  fill='currentColor'
                  d='M9.539 15.23q-2.398 0-4.065-1.666Q3.808 11.899 3.808 9.5t1.666-4.065T9.539 3.77t4.064 1.666T15.269 9.5q0 1.042-.369 2.017t-.97 1.668l5.909 5.907q.14.14.15.345q.009.203-.15.363q-.16.16-.354.16t-.354-.16l-5.908-5.908q-.75.639-1.725.989t-1.96.35m0-1q1.99 0 3.361-1.37q1.37-1.37 1.37-3.361T12.9 6.14T9.54 4.77q-1.991 0-3.361 1.37T4.808 9.5t1.37 3.36t3.36 1.37'
                />
              </svg>
            </button>
          </form>
        </div>

        {typeFilters.length > 0 && (
          <div className='mt-3 space-y-2'>
            <div className='flex flex-wrap gap-2'>
              {typeFilters.map(([type, count]) => {
                const active = activeTypes.includes(type);
                const label = prettifyType(type);
                return (
                  <button
                    key={type}
                    type='button'
                    onClick={() => toggleType(type)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.28em] transition ${
                      active
                        ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                        : 'border-[var(--foreground)]/22 bg-[var(--background)]/80 text-[var(--foreground)]/85 hover:border-[var(--foreground)]/40'
                    }`}>
                    <span
                      className='h-3 w-3 rounded-full border border-[var(--foreground)]/30'
                      style={{
                        backgroundColor:
                          markerColors[type] || markerColors.default,
                      }}
                    />
                    <span>{label}</span>
                    <span className='text-[var(--foreground)]/50'>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className='mt-4 flex flex-col gap-3 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/50 sm:flex-row sm:items-center sm:justify-between'>
          <span>{statusLabel}</span>
          <div className='flex items-center justify-between gap-3 sm:justify-end'>
            {hasActiveFilters && (
              <button
                type='button'
                onClick={onClearFilters}
                className='nav-action h-8 rounded-full px-4 text-[10px] uppercase tracking-[0.32em] text-[var(--foreground)]/75 hover:text-[var(--foreground)]'>
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-6 py-6'>
        {loading ? (
          <p className='text-sm italic text-[var(--foreground)]/70'>
            Loading spaces…
          </p>
        ) : error ? (
          <p className='text-sm text-[var(--foreground)]/70'>{error}</p>
        ) : spaces.length === 0 ? (
          <p className='text-sm italic text-[var(--foreground)]/70'>
            No spaces match filters.
          </p>
        ) : (
          <div className='space-y-4'>
            {spaces.map((space) => (
              <SpaceListItem
                key={space.id}
                space={space}
                variant='compact'
                onFocus={onFocus}
                isActive={
                  focusedId != null &&
                  String(focusedId) === String(space.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
