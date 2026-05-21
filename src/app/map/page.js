'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SpaceListItem from '@/components/SpaceListItem';
import markerColors from '@/lib/markerColors';

// Defined outside the component so the reference is stable across re-renders.
// Inline objects like {{ lat, lng }} create a new reference every render, which
// triggers MapComponent's map-init effect and destroys/recreates the map.
const INITIAL_CENTER = { lat: 51.3397, lng: 12.3731 };
const INITIAL_ZOOM = 11;

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className='w-full h-full bg-[var(--background)]/40' />,
});

function normaliseType(t) {
  return t ? String(t).toLowerCase() : 'other';
}
function prettifyType(t) {
  if (!t || t === 'other') return 'other';
  return t.replace(/[_-]+/g, ' ').trim();
}

export default function SpacesMapPage() {
  const [spaces, setSpaces] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [focusedSpaceId, setFocusedSpaceId] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/spaces')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => { if (alive) { setSpaces(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch((e) => { console.error(e); if (alive) { setError('Unable to load spaces.'); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const getStyle = () =>
      document.documentElement.classList.contains('dusk')
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11';

    setMapStyle(getStyle());

    const observer = new MutationObserver(() => setMapStyle(getStyle()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const typeFilters = useMemo(() => {
    const c = new Map();
    spaces.forEach((s) => { const k = normaliseType(s.type); c.set(k, (c.get(k) || 0) + 1); });
    return Array.from(c.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
  }, [spaces]);

  const filteredSpaces = useMemo(() => {
    if (!spaces.length) return [];
    const q = searchQuery.trim().toLowerCase();
    return spaces
      .filter((s) => {
        const typeOk = !activeTypes.length || activeTypes.includes(normaliseType(s.type));
        const queryOk = !q || [s.name, s.city, s.website].filter(Boolean).join(' ').toLowerCase().includes(q);
        return typeOk && queryOk;
      })
      .sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
  }, [spaces, activeTypes, searchQuery]);

  const cityStats = useMemo(() => ({
    total: spaces.length,
    cities: Array.from(new Set(spaces.map((s) => s.city).filter(Boolean))).sort(),
  }), [spaces]);

  useEffect(() => { setFocusedSpaceId(null); setCardOpen(false); }, [searchQuery, activeTypes]);

  const focusedSpace = useMemo(
    () => spaces.find((s) => String(s.id) === String(focusedSpaceId)) || null,
    [focusedSpaceId, spaces]
  );

  // Stable — empty deps because setters are guaranteed stable by React.
  // Critical: prevents MapComponent's addMarkers effect from re-running (and
  // calling fitBounds) when overlayOpen/cardOpen state changes.
  const handleMarkerSelect = useCallback((id) => {
    if (id == null) return;
    setFocusedSpaceId((prev) => String(prev) === String(id) ? prev : id);
    setCardOpen(true);
    setSheetOpen(false);
  }, []);

  const handleFocusFromList = useCallback((space) => {
    if (!space?.id) return;
    setFocusedSpaceId(space.id);
    setCardOpen(true);
    setSheetOpen(false);
  }, []);

  const toggleType = useCallback((type) =>
    setActiveTypes((p) => p.includes(type) ? p.filter((t) => t !== type) : [...p, type])
  , []);

  const clearFilters = useCallback(() => { setSearchQuery(''); setActiveTypes([]); }, []);
  const hasFilters = activeTypes.length > 0 || !!searchQuery.trim();
  const isDusk = mapStyle.includes('dark');

  // Overlay styles adapt to map theme so text is always readable against the map background
  const overlayBg = isDusk
    ? 'bg-[#1e1e1e]/95 border-white/10'
    : 'bg-white/90 border-black/8';
  const overlayText = isDusk ? 'text-white/80' : 'text-black/60';
  const overlayTextStrong = isDusk ? 'text-white' : 'text-black/85';
  const inputClass = isDusk
    ? 'bg-white/8 border-white/12 text-white placeholder:text-white/35 focus:ring-white/25'
    : 'bg-black/5 border-black/10 text-black/80 placeholder:text-black/35 focus:ring-black/20';

  return (
    <div
      className='relative overflow-hidden bg-[var(--background)]'
      style={{ height: 'calc(100dvh - 72px)' }}>

      {/* ── Full-bleed map ──────────────────────────────────────── */}
      <MapComponent
        spaces={filteredSpaces}
        activeTypes={activeTypes}
        autoFit
        fitKey={`map-v2-${filteredSpaces.length}`}
        initialAutoFitZoomOffset={1}
        focusSpaceId={focusedSpaceId}
        initialCenter={INITIAL_CENTER}
        initialZoom={INITIAL_ZOOM}
        mapStyle={mapStyle}
        minAutoFitZoom={5}
        onMarkerSelect={handleMarkerSelect}
        showPopups={false}
      />

      {/* ── Floating top bar ───────────────────────────────────── */}
      <div className='pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-col gap-2 sm:inset-x-4 sm:top-4'>

        {/* Stats + search row */}
        <div className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-2xl ${overlayBg}`}>
          <div className='flex items-center gap-3'>
            {cityStats.cities.length > 0 ? (
              <p className={`flex-1 truncate text-[10px] uppercase tracking-[0.24em] ${overlayText}`}>
                {cityStats.total} spaces · {cityStats.cities.join(' · ')}
              </p>
            ) : (
              <p className={`flex-1 text-[10px] uppercase tracking-[0.24em] ${overlayText}`}>
                Spaces
              </p>
            )}
            <form role='search' onSubmit={(e) => e.preventDefault()} className='flex items-center gap-2'>
              <input
                ref={searchRef}
                type='search'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search…'
                className={`w-36 rounded-full border px-3 py-1.5 text-[11px] tracking-wide focus:outline-none focus:ring-1 sm:w-48 ${inputClass}`}
                aria-label='Search spaces'
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={() => setSearchQuery('')}
                  aria-label='Clear search'
                  className={overlayText}>
                  <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
                    <path d='M18 6 6 18M6 6l12 12'/>
                  </svg>
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Type filter pills */}
        {typeFilters.length > 0 && (
          <div className='pointer-events-auto flex flex-wrap gap-1.5'>
            {typeFilters.map(([type, count]) => {
              const active = activeTypes.includes(type);
              return (
                <button
                  key={type}
                  type='button'
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] shadow-sm backdrop-blur-xl transition ${
                    active
                      ? isDusk
                        ? 'border-white bg-white text-black'
                        : 'border-black/80 bg-black/85 text-white'
                      : isDusk
                        ? 'border-white/20 bg-[#1e1e1e]/90 text-white/75 hover:border-white/40'
                        : 'border-black/12 bg-white/88 text-black/65 hover:border-black/28'
                  }`}>
                  <span
                    className='h-2 w-2 rounded-full'
                    style={{ backgroundColor: markerColors[type] || markerColors.other }}
                  />
                  {prettifyType(type)}
                  {active && <span className='opacity-60'>{count}</span>}
                </button>
              );
            })}
            {hasFilters && (
              <button
                type='button'
                onClick={clearFilters}
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] shadow-sm backdrop-blur-xl transition ${
                  isDusk
                    ? 'border-white/20 bg-[#1e1e1e]/90 text-white/50 hover:text-white'
                    : 'border-black/12 bg-white/88 text-black/45 hover:text-black/80'
                }`}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Selected space card ────────────────────────────────── */}
      {cardOpen && focusedSpace && (
        <div className='pointer-events-none absolute inset-x-3 bottom-20 z-20 flex justify-center sm:inset-x-4 lg:inset-auto lg:bottom-6 lg:right-5 lg:justify-end'>
          <div className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-[22px] border shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl ${overlayBg}`}>
            <div className={`flex items-center justify-between border-b px-5 py-3 ${isDusk ? 'border-white/8' : 'border-black/6'}`}>
              <span className={`text-[10px] uppercase tracking-[0.32em] ${overlayText}`}>
                Space
              </span>
              <button
                type='button'
                onClick={() => setCardOpen(false)}
                className={`text-[10px] uppercase tracking-[0.28em] transition ${overlayText} hover:${overlayTextStrong}`}>
                Close
              </button>
            </div>
            <div className='px-4 py-4'>
              <SpaceListItem
                space={focusedSpace}
                variant='compact'
                isActive
                surface='overlay'
                showActions
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom: List button ────────────────────────────────── */}
      {!sheetOpen && (
        <div className='absolute bottom-5 left-1/2 z-20 -translate-x-1/2'>
          <button
            type='button'
            onClick={() => setSheetOpen(true)}
            className={`flex items-center gap-2 rounded-full border px-6 py-2.5 text-[11px] uppercase tracking-[0.32em] shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl transition ${
              isDusk
                ? 'border-white/18 bg-[#1e1e1e]/92 text-white/70 hover:text-white'
                : 'border-black/12 bg-white/90 text-black/60 hover:text-black/90'
            }`}>
            <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
              <line x1='8' y1='6' x2='21' y2='6'/><line x1='8' y1='12' x2='21' y2='12'/><line x1='8' y1='18' x2='21' y2='18'/>
              <line x1='3' y1='6' x2='3.01' y2='6'/><line x1='3' y1='12' x2='3.01' y2='12'/><line x1='3' y1='18' x2='3.01' y2='18'/>
            </svg>
            List
          </button>
        </div>
      )}

      {/* ── Bottom sheet ───────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className='absolute inset-0 z-30'
          onClick={() => setSheetOpen(false)}>
          <div
            className='absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col overflow-hidden rounded-t-[28px] border-t border-[var(--foreground)]/10 bg-[var(--background)] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] lg:inset-x-auto lg:left-1/2 lg:max-w-2xl lg:-translate-x-1/2 lg:rounded-t-[28px]'
            onClick={(e) => e.stopPropagation()}>

            {/* Handle */}
            <div className='flex-shrink-0 px-5 pt-4'>
              <div className='mx-auto h-1 w-10 rounded-full bg-[var(--foreground)]/15' />
            </div>

            {/* Sheet header */}
            <div className='flex-shrink-0 border-b border-[var(--foreground)]/8 px-5 py-4'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  {cityStats.cities.length > 0 && (
                    <p className='text-[10px] uppercase tracking-[0.24em] leading-relaxed text-[var(--foreground)]/50'>
                      {loading ? 'Loading…' : `${filteredSpaces.length}${hasFilters ? ` of ${cityStats.total}` : ''} spaces · ${cityStats.cities.join(' · ')}`}
                    </p>
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => setSheetOpen(false)}
                  className='flex-shrink-0 text-[10px] uppercase tracking-[0.28em] text-[var(--foreground)]/40 hover:text-[var(--foreground)]'>
                  Close
                </button>
              </div>

              {/* Inline search + filters inside sheet */}
              <form role='search' onSubmit={(e) => e.preventDefault()} className='mt-3 flex items-center gap-2 rounded-xl border border-[var(--foreground)]/12 bg-[var(--background)]/60 px-3 py-2'>
                <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='flex-shrink-0 text-[var(--foreground)]/35'>
                  <circle cx='11' cy='11' r='8'/><path d='m21 21-4.35-4.35'/>
                </svg>
                <input
                  type='search'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search by space or city'
                  className='flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 focus:outline-none'
                  aria-label='Search spaces'
                />
              </form>

              {typeFilters.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {typeFilters.map(([type, count]) => {
                    const active = activeTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type='button'
                        onClick={() => toggleType(type)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] transition ${
                          active
                            ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                            : 'border-[var(--foreground)]/18 text-[var(--foreground)]/65 hover:border-[var(--foreground)]/35'
                        }`}>
                        <span className='h-2 w-2 rounded-full' style={{ backgroundColor: markerColors[type] || markerColors.other }} />
                        {prettifyType(type)} {count}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Space list */}
            <div className='flex-1 overflow-y-auto px-4 py-3 space-y-1.5'>
              {loading ? (
                <p className='px-1 py-4 text-sm italic text-[var(--foreground)]/45'>Loading spaces…</p>
              ) : error ? (
                <p className='px-1 py-4 text-sm text-[var(--foreground)]/50'>{error}</p>
              ) : filteredSpaces.length === 0 ? (
                <p className='px-1 py-4 text-sm italic text-[var(--foreground)]/45'>No spaces match.</p>
              ) : (
                filteredSpaces.map((space) => (
                  <SpaceListItem
                    key={space.id}
                    space={space}
                    variant='compact'
                    showActions={false}
                    onFocus={handleFocusFromList}
                    isActive={focusedSpaceId != null && String(focusedSpaceId) === String(space.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
