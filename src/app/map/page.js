'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useContext, useMemo, useState } from 'react';

import { FilterContext } from '@/contexts/FilterContext';
import Modal from '@/components/Modal';
import MarkerDot from '@/components/MarkerDot';
import markerColors, { CATEGORY_ABBREV } from '@/lib/markerColors';
import { CITY_COORDINATES } from '@/lib/cityCoordinates';
import useCities from '@/hooks/useCities';
import { getMarkerState } from '@/lib/markerState';
import { formatDate } from '@/lib/date';

// Defined outside the component so the reference is stable across re-renders.
const OVERVIEW_CENTER = { lat: 48.8566, lng: 2.3522 };
const OVERVIEW_ZOOM = 5;
const ALL_CITIES = 'All';
const CATEGORIES = Object.keys(markerColors);
const EVENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Happening today' },
  { value: 'upcoming', label: 'Upcoming' },
];

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className='w-full h-full bg-[var(--background)]/40' />,
});

// Mapbox-equivalent of eos-archive-app's regionForSpaces() — raw bounds
// (Mapbox's fitBounds padding option handles the visual breathing room,
// so there's no need to pad the bounds in degrees the way mobile does).
function boundsForSpaces(list) {
  const lats = list.map((s) => s.latitude);
  const lngs = list.map((s) => s.longitude);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export default function SpacesMapPage() {
  const {
    allSpaces,
    eventMap,
    filtersLoading,
    filtersError,
    refetchFilterData,
  } = useContext(FilterContext);

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [eventFilter, setEventFilter] = useState('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null);

  const spaces = useMemo(() => {
    return (allSpaces || [])
      .filter((s) => s.is_active)
      .map((s) => {
        const lat = s.lat ?? s.latitude;
        const lng = s.lng ?? s.longitude;
        if (lat == null || lng == null) return null;
        return {
          id: s.id,
          name: s.name,
          city: s.city_name ?? s.city,
          category: s.category ?? s.type,
          latitude: Number(lat),
          longitude: Number(lng),
        };
      })
      .filter(Boolean);
  }, [allSpaces]);

  const cityOptions = useCities();
  const cities = useMemo(
    () => [ALL_CITIES, ...cityOptions.map((c) => c.name)],
    [cityOptions]
  );

  const filteredSpaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    const categoryFilter = new Set(
      Array.from(selectedCategories).map((c) => c.toLowerCase())
    );
    return spaces.filter((s) => {
      const matchesCity = selectedCity === ALL_CITIES || s.city === selectedCity;
      const matchesSearch =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter.size === 0 ||
        (!!s.category && categoryFilter.has(s.category.toLowerCase()));
      const state = getMarkerState(s.id, eventMap);
      const matchesEvent =
        eventFilter === 'all' ||
        (eventFilter === 'today' && state === 'live') ||
        (eventFilter === 'upcoming' && state !== 'default');
      return matchesCity && matchesSearch && matchesCategory && matchesEvent;
    });
  }, [spaces, search, selectedCity, selectedCategories, eventFilter, eventMap]);

  const activeFilterGroups =
    (selectedCategories.size > 0 ? 1 : 0) + (eventFilter !== 'all' ? 1 : 0);
  const hasActiveFilters = activeFilterGroups > 0;

  const handleMarkerSelect = useCallback(
    (id) => {
      if (id == null) return;
      const space = spaces.find((s) => String(s.id) === String(id));
      if (space) setSelected(space);
    },
    [spaces]
  );

  function toggleCategory(cat) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
    setSelected(null);
  }

  function clearFilters() {
    setSelectedCategories(new Set());
    setEventFilter('all');
  }

  function filterCity(city) {
    setSelectedCity(city);
    setSelected(null);

    if (city === ALL_CITIES) {
      setCameraTarget({
        center: [OVERVIEW_CENTER.lng, OVERVIEW_CENTER.lat],
        zoom: OVERVIEW_ZOOM,
      });
      return;
    }

    const citySpaces = spaces.filter((s) => s.city === city);
    if (citySpaces.length > 0) {
      setCameraTarget({ bounds: boundsForSpaces(citySpaces) });
      return;
    }

    const anchor = CITY_COORDINATES[city];
    setCameraTarget(
      anchor
        ? { center: [anchor.lng, anchor.lat], zoom: 11 }
        : { center: [OVERVIEW_CENTER.lng, OVERVIEW_CENTER.lat], zoom: OVERVIEW_ZOOM }
    );
  }

  const selectedState = selected ? getMarkerState(selected.id, eventMap) : 'default';
  const selectedNextEventDate = selected ? eventMap[selected.id] : undefined;
  const selectedColor = selected
    ? markerColors[(selected.category || 'other').toLowerCase()] || markerColors.other
    : markerColors.other;
  const today = new Date().toISOString().slice(0, 10);

  if (filtersLoading) {
    return (
      <div
        className='flex items-center justify-center bg-[var(--background)] text-sm uppercase tracking-[0.24em] text-[var(--foreground)]/50'
        style={{ height: 'calc(100dvh - 72px)' }}>
        Loading map…
      </div>
    );
  }

  if (filtersError) {
    return (
      <div
        className='flex flex-col items-center justify-center gap-4 bg-[var(--background)] px-4 text-center'
        style={{ height: 'calc(100dvh - 72px)' }}>
        <p className='text-sm text-[var(--foreground)]/70'>
          Something went wrong loading the map.
        </p>
        <button type='button' onClick={refetchFilterData} className='nav-action'>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      className='relative overflow-hidden bg-[var(--background)]'
      style={{ height: 'calc(100dvh - 72px)' }}>
      <MapComponent
        spaces={filteredSpaces}
        eventMap={eventMap}
        cameraTarget={cameraTarget}
        initialCenter={OVERVIEW_CENTER}
        initialZoom={OVERVIEW_ZOOM}
        mapStyle='mapbox://styles/mapbox/dark-v11'
        onMarkerSelect={handleMarkerSelect}
        showPopups={false}
        fallbackToAllSpaces={false}
      />

      {/* Search + filter icon + city pills */}
      <div className='pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col gap-2 sm:inset-x-4 sm:top-4'>
        <div className='pointer-events-auto flex items-center gap-2'>
          <form
            role='search'
            onSubmit={(e) => e.preventDefault()}
            className='nav-search flex-1 !max-w-none'>
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search spaces…'
              className='nav-search__input'
              aria-label='Search spaces'
            />
          </form>
          <button
            type='button'
            onClick={() => setFilterSheetOpen(true)}
            aria-label={hasActiveFilters ? `Filters, ${activeFilterGroups} active` : 'Filters'}
            className='nav-action relative !inline-flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center !p-0'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              aria-hidden='true'>
              <line x1='4' y1='6' x2='20' y2='6' />
              <line x1='4' y1='12' x2='20' y2='12' />
              <line x1='4' y1='18' x2='20' y2='18' />
              <circle cx='9' cy='6' r='2' fill='var(--background)' />
              <circle cx='15' cy='12' r='2' fill='var(--background)' />
              <circle cx='9' cy='18' r='2' fill='var(--background)' />
            </svg>
            {hasActiveFilters && (
              <span
                className='absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full'
                style={{ backgroundColor: 'var(--chrome)' }}
              />
            )}
          </button>
        </div>

        <div
          className='pointer-events-auto flex gap-2 overflow-x-auto pb-1'
          style={{ scrollbarWidth: 'none' }}>
          {cities.map((city) => (
            <button
              key={city}
              type='button'
              onClick={() =>
                filterCity(city === selectedCity && city !== ALL_CITIES ? ALL_CITIES : city)
              }
              className={`nav-pill flex-shrink-0 ${city === selectedCity ? 'nav-pill--active' : ''}`}>
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Category legend — only visible when no marker is selected */}
      {!selected && (
        <div className='pointer-events-none absolute inset-x-2 bottom-4 z-10 flex flex-wrap items-center justify-center gap-1.5'>
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.has(cat);
            const color = markerColors[cat];
            return (
              <button
                key={cat}
                type='button'
                onClick={() => toggleCategory(cat)}
                className='pointer-events-auto flex items-center gap-1 rounded-lg border border-transparent bg-black/65 px-1.5 py-1'
                style={active ? { backgroundColor: `${color}33`, borderColor: color } : undefined}>
                <span
                  className='h-1.5 w-1.5 rounded-full'
                  style={{ backgroundColor: color, opacity: active ? 1 : 0.6 }}
                />
                <span
                  className={`text-[7px] tracking-wide ${active ? 'text-[var(--foreground)]' : 'text-[var(--foreground-secondary)]'}`}>
                  {CATEGORY_ABBREV[cat] || cat.slice(0, 3).toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Single-space sheet */}
      {selected && (
        <div className='map-space-sheet absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-[var(--card-border)] bg-[var(--card)] px-5 pb-10 pt-4 shadow-[0_-20px_60px_rgba(0,0,0,0.3)]'>
          <button
            type='button'
            onClick={() => setSelected(null)}
            aria-label='Close'
            className='absolute right-3 top-3 p-1 text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'>
            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
              <path d='M18 6 6 18M6 6l12 12' />
            </svg>
          </button>
          <div className='mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--input-border)]' />

          <h3 className='text-lg font-bold text-[var(--foreground)]'>{selected.name}</h3>
          {(selected.city || selected.category) && (
            <div className='mt-1 flex items-center gap-1.5'>
              <MarkerDot state={selectedState} color={selectedColor} dotSize={8} ringSize={16} />
              <span className='text-[11px] uppercase tracking-[0.14em] text-[var(--foreground-secondary)]'>
                {selected.city}
                {selected.city && selected.category ? ' · ' : ''}
                {selected.category}
              </span>
            </div>
          )}

          {selectedState === 'live' && selectedNextEventDate && (
            <p className='mt-3 text-xs font-medium' style={{ color: 'var(--chrome)' }}>
              ● {selectedNextEventDate === today ? 'Tonight' : 'Tomorrow'} · {formatDate(selectedNextEventDate)}
            </p>
          )}
          {selectedState === 'soon' && selectedNextEventDate && (
            <p className='mt-3 text-xs font-medium text-[var(--foreground-secondary)]'>
              Next event · {formatDate(selectedNextEventDate)}
            </p>
          )}

          <Link
            href={`/spaces/${selected.id}`}
            className='nav-cta mt-4 flex w-full items-center justify-center'>
            View space →
          </Link>
        </div>
      )}

      {/* Filter sheet */}
      <Modal open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} label='Map filters'>
        <div className='flex max-h-[75vh] flex-col'>
          <div className='flex items-center justify-between pb-4'>
            <span className='ea-label'>Filters</span>
            {hasActiveFilters && (
              <button type='button' onClick={clearFilters} className='text-xs' style={{ color: 'var(--chrome)' }}>
                Clear
              </button>
            )}
          </div>

          <div className='flex-1 space-y-6 overflow-y-auto pb-4'>
            <div className='space-y-2'>
              <span className='ea-label ea-label--muted'>Category</span>
              <div className='flex flex-wrap gap-2'>
                {CATEGORIES.map((cat) => {
                  const active = selectedCategories.has(cat);
                  return (
                    <button
                      key={cat}
                      type='button'
                      onClick={() => toggleCategory(cat)}
                      className={`nav-pill ${active ? 'nav-pill--active' : ''}`}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className='space-y-2'>
              <span className='ea-label ea-label--muted'>Events</span>
              <div className='flex flex-col gap-2'>
                {EVENT_STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => setEventFilter(value)}
                    className={`nav-pill w-full !justify-start ${eventFilter === value ? 'nav-pill--active' : ''}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className='border-t border-[var(--card-border)] pt-4'>
            <button
              type='button'
              onClick={() => setFilterSheetOpen(false)}
              className='nav-cta flex w-full items-center justify-center'>
              Show {filteredSpaces.length} spaces
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
