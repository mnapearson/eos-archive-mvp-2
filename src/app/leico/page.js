'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SpaceListItem from '@/components/SpaceListItem';
import Spinner from '@/components/Spinner';
import markerColors from '@/lib/markerColors';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full items-center justify-center bg-[var(--background)]/70'>
      <Spinner />
    </div>
  ),
});

function normaliseType(type) {
  if (!type) return 'other';
  return String(type).toLowerCase();
}

function prettifyType(type) {
  if (!type || type === 'other') return 'other';
  return type.replace(/[_-]+/g, ' ').trim();
}

export default function LeicoPage() {
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTypes, setActiveTypes] = useState([]);
  const [focusedSpaceId, setFocusedSpaceId] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const mapSectionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeicoSpaces() {
      setLoading(true);
      setError('');
      try {
        const { data, error: supabaseError } = await supabase
          .from('spaces')
          .select(
            'id, name, type, latitude, longitude, city, website, description, image_url, address'
          )
          .eq('leico', true)
          .order('name', { ascending: true });

        if (supabaseError) throw supabaseError;
        if (isMounted) {
          setSpaces(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching LEICO spaces:', err);
        if (isMounted) {
          setSpaces([]);
          setError('Unable to load LEICO partner spaces right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLeicoSpaces();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

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

    const matchesType = (space) => {
      if (activeTypes.length === 0) return true;
      return activeTypes.includes(normaliseType(space.type));
    };
    return spaces.filter((space) => matchesType(space));
  }, [spaces, activeTypes]);

  const totalCount = filteredSpaces.length;
  const focusedSpace = useMemo(() => {
    if (!focusedSpaceId) return null;
    return (
      spaces.find((space) => String(space.id) === String(focusedSpaceId)) ||
      null
    );
  }, [focusedSpaceId, spaces]);

  useEffect(() => {
    setFocusedSpaceId(null);
    setOverlayOpen(false);
  }, [activeTypes]);

  const scrollToMap = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!mapSectionRef.current) return;
    if (window.innerWidth >= 1024) return;
    mapSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const toggleType = (type) => {
    setActiveTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setActiveTypes([]);
  };

  const hasActiveFilters = activeTypes.length > 0;

  return (
    <main className='map-page flex min-h-[calc(100vh-72px)] flex-col bg-[var(--background)] lg:flex-row'>
      <section className='order-1 w-full border-b border-[var(--foreground)]/12 px-6 py-6 space-y-4 lg:hidden'>
        <span className='ea-label ea-label--muted text-[var(--foreground)]/70'>
          LEICO × EOS archive
        </span>
        <h1 className='text-balance text-2xl font-semibold text-[var(--foreground)] sm:text-3xl'>
          Leipzig’s contemporary art map
        </h1>
        <p className='max-w-xl text-sm leading-relaxed text-[var(--foreground)]/70'>
          Discover the spaces featured in the LEICO printed map. Browse and tap
          any card to spotlight its position on the city map.
        </p>
      </section>

      <section
        ref={mapSectionRef}
        className='relative order-2 h-[48vh] w-full overflow-hidden border-b border-[var(--foreground)]/12 lg:order-2 lg:h-auto lg:flex-1 lg:border-b-0'>
        <MapComponent
          spaces={filteredSpaces}
          activeTypes={activeTypes}
          autoFit
          fitKey={`leico-${filteredSpaces.length}-${activeTypes.join(',')}`}
          focusSpaceId={focusedSpaceId}
          initialCenter={{ lat: 51.3397, lng: 12.3731 }}
          initialZoom={12}
          fallbackToAllSpaces={false}
          onMarkerSelect={(id) => {
            if (id == null) return;
            setFocusedSpaceId((prev) =>
              String(prev) === String(id) ? prev : id
            );
            setOverlayOpen(true);
          }}
          showPopups={false}
        />

        <LeicoFocusedOverlay
          space={focusedSpace}
          open={overlayOpen}
          onClose={() => setOverlayOpen(false)}
        />
      </section>

      <LeicoListPanel
        spaces={filteredSpaces}
        totalCount={totalCount}
        allCount={spaces.length}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        typeFilters={typeFilters}
        activeTypes={activeTypes}
        toggleType={toggleType}
        loading={loading}
        error={error}
        onFocus={(space) => {
          if (!space?.id) return;
          setFocusedSpaceId(space.id);
          setOverlayOpen(true);
          scrollToMap();
        }}
        focusedId={focusedSpaceId}
      />
    </main>
  );
}

function LeicoListPanel({
  spaces,
  totalCount,
  allCount,
  onClearFilters,
  hasActiveFilters,
  typeFilters,
  activeTypes,
  toggleType,
  loading,
  error,
  onFocus,
  focusedId,
}) {
  const statusLabel = loading ? 'Loading spaces…' : error;
  return (
    <aside className='order-3 flex min-h-[48vh] w-full flex-col border-t border-[var(--foreground)]/12 bg-[var(--background)]/96 backdrop-blur-xl lg:order-1 lg:h-[calc(100vh-72px)] lg:max-w-[520px] lg:border-t-0 lg:border-r lg:border-[var(--foreground)]/12'>
      <div className='hidden border-b border-[var(--foreground)]/12 px-6 py-6 lg:block'>
        <span className='ea-label ea-label--muted text-[var(--foreground)]/70'>
          LEICO × EOS archive
        </span>
        <h1 className='text-balance text-2xl font-semibold text-[var(--foreground)] sm:text-3xl'>
          Leipzig’s contemporary art map
        </h1>
        <p className='max-w-xl text-sm leading-relaxed text-[var(--foreground)]/70'>
          Discover the spaces featured in the LEICO printed map. Browse and tap
          any card to spotlight its position on the city map.
        </p>
      </div>

      <div className='border-b border-[var(--foreground)]/12 px-6 py-4'>
        {typeFilters.length > 1 && (
          <div className='mt-2 space-y-2'>
            <div className='flex flex-wrap gap-2'>
              {typeFilters.map(([type, count]) => {
                const active = activeTypes.includes(type);
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
                    <span>{prettifyType(type)}</span>
                    <span className='text-[var(--foreground)]/50'>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className='mt-4 flex flex-col gap-3 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/55 sm:flex-row sm:items-center sm:justify-between'>
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
            No spaces match the current filters.
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
                  focusedId != null && String(focusedId) === String(space.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function LeicoFocusedOverlay({ space, open, onClose }) {
  if (!open || !space) return null;

  return (
    <div className='pointer-events-none absolute inset-x-4 bottom-4 z-30 flex justify-center lg:inset-auto lg:bottom-auto lg:right-6 lg:top-6 lg:left-auto lg:justify-end'>
      <div className='pointer-events-auto w-full max-w-md rounded-[28px] border border-white/70 bg-[rgba(247,247,247,0.92)] text-[#1b1b1b] shadow-[0_34px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl'>
        <div className='flex items-center justify-between px-5 pt-4 text-[#2a2a2a]'>
          <span className='ea-label tracking-[0.3em] text-[#3a3a3a]'>
            Selected space
          </span>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close selected space'
            className='ea-label text-[#3a3a3a] hover:text-[#1b1b1b]'>
            Close
          </button>
        </div>
        <div className='px-5 pb-5'>
          <SpaceListItem
            space={space}
            variant='compact'
            isActive
            surface='overlay'
            className='text-[#1b1b1b]'
          />
        </div>
      </div>
    </div>
  );
}
