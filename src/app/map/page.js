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
  const [listOpen, setListOpen] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setPanelCollapsed(prefersCollapsed);
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
    <main className='map-page relative isolate w-full min-h-[calc(100vh-72px)]'>
      <div className='absolute inset-0'>
        <MapComponent
          spaces={filteredSpaces}
          activeTypes={activeTypes}
          autoFit
          fitKey={`${panelCollapsed ? 'collapsed' : 'expanded'}-${
            listOpen ? 'list-open' : 'list-closed'
          }`}
          initialCenter={{ lat: 51.3397, lng: 12.3731 }}
          initialZoom={11}
        />
      </div>

      <div className='pointer-events-none absolute top-0 left-0 right-0 flex justify-center px-4 pt-6 sm:justify-start sm:px-6 sm:pt-8 lg:px-8'>
        <section
          className={`pointer-events-auto transition-all duration-300 ${
            panelCollapsed
              ? 'flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-[var(--foreground)]/14 bg-[var(--background)]/85 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/70 shadow-[0_14px_32px_rgba(0,0,0,0.18)] backdrop-blur-lg sm:max-w-4xl'
              : 'w-full max-w-3xl rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/90 px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:max-w-4xl'
          }`}>
          {panelCollapsed ? (
            <>
              <span className='ea-label ea-label--muted shrink-0 text-[var(--foreground)]'>
                Spaces archive
              </span>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setListOpen(true)}
                  className='nav-action h-8 whitespace-nowrap rounded-full px-3 text-xs uppercase tracking-[0.28em]'>
                  Browse list ({totalCount})
                </button>
                <button
                  type='button'
                  onClick={() => setPanelCollapsed(false)}
                  className='nav-action nav-cta h-8 whitespace-nowrap rounded-full px-3 text-xs uppercase tracking-[0.28em]'>
                  Open panel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-2'>
                  <span className='ea-label ea-label--muted'>
                    Spaces archive
                  </span>
                  <h1 className='quick-view__title text-balance text-2xl sm:text-3xl'>
                    Map of independent scenes
                  </h1>
                  <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70'>
                    Explore the venues, studios, and cultural spaces that power
                    the archive. Filter by type, search for a city or name, and
                    dive into the map.
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setListOpen((open) => !open)}
                    className='nav-action h-8 whitespace-nowrap rounded-full px-3 text-xs uppercase tracking-[0.28em]'>
                    {listOpen ? 'Close list' : `Browse list (${totalCount})`}
                  </button>
                  <button
                    type='button'
                    onClick={() => setPanelCollapsed(true)}
                    className='nav-action nav-cta h-8 whitespace-nowrap rounded-full px-3 text-xs uppercase tracking-[0.28em]'>
                    Collapse
                  </button>
                </div>
              </div>

              <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <input
                  type='search'
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder='Search by space or city'
                  className='input w-full sm:max-w-xs'
                  aria-label='Search spaces'
                />
                {hasActiveFilters && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchQuery('');
                      clearTypes();
                    }}
                    className='rounded-full border border-[var(--foreground)]/20 px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/60 hover:border-[var(--foreground)]/40 hover:text-[var(--foreground)]'>
                    Clear filters
                  </button>
                )}
              </div>

              {typeFilters.length > 0 && (
                <div className='mt-4 space-y-2'>
                  <button
                    type='button'
                    className='ea-label text-[var(--foreground)]/60 sm:hidden'
                    onClick={() => setLegendCollapsed((value) => !value)}
                    aria-expanded={!legendCollapsed}>
                    {legendCollapsed ? 'Show types ▸' : 'Hide types ▾'}
                  </button>
                  <div
                    className={`flex flex-wrap gap-2 transition-all ${
                      legendCollapsed
                        ? 'max-h-0 overflow-hidden sm:max-h-none'
                        : 'max-h-[420px]'
                    } sm:max-h-none`}>
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

              <div className='mt-4 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/50'>
                {loading
                  ? 'Loading spaces…'
                  : error
                  ? error
                  : `${totalCount} space${totalCount === 1 ? '' : 's'} visible`}
              </div>
            </>
          )}
        </section>
      </div>

      <SpacesDrawer
        open={listOpen}
        onClose={() => setListOpen(false)}
        spaces={filteredSpaces}
      />
    </main>
  );
}

function SpacesDrawer({ open, onClose, spaces }) {
  return (
    <aside
      className={`pointer-events-auto fixed inset-x-4 bottom-5 z-40 w-auto max-w-3xl self-center rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/96 backdrop-blur-lg shadow-[0_30px_80px_rgba(0,0,0,0.26)] transition-all duration-300 sm:left-auto sm:right-8 sm:w-[min(420px,38vw)] sm:translate-x-0 ${
        open
          ? 'translate-y-0 opacity-100'
          : 'translate-y-6 opacity-0 pointer-events-none sm:translate-y-0 sm:translate-x-[calc(100%+2rem)]'
      }`}>
      <div className='flex items-center justify-between border-b border-[var(--foreground)]/8 px-4 py-3'>
        <span className='ea-label ea-label--muted'>
          Spaces ({spaces.length})
        </span>
        <button
          type='button'
          onClick={onClose}
          className='text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/60 hover:text-[var(--foreground)]'>
          Close
        </button>
      </div>
      <div className='max-h-[60vh] overflow-y-auto px-4 py-4 space-y-4'>
        {spaces.length === 0 ? (
          <p className='text-sm italic text-[var(--foreground)]/70'>
            No spaces match filters.
          </p>
        ) : (
          spaces.map((space) => (
            <SpaceListItem
              key={space.id}
              space={space}
            />
          ))
        )}
      </div>
    </aside>
  );
}
