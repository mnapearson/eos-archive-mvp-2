'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterContext } from '@/contexts/FilterContext';
import { supabase } from '@/lib/supabaseClient';
import MasonryGrid from '@/components/MasonryGrid';
import Spinner from '@/components/Spinner';
import Link from 'next/link';
import Modal from '@/components/Modal';
import EventQuickView from '@/components/EventQuickView';
import EAImage from '@/components/EAImage';
import { formatDateRange } from '@/lib/date';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedFilters, setSelectedFilters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all'); // 'all' | 'upcoming' | 'current' | 'past'
  const [view, setView] = useState('grid'); // 'grid' | 'list'
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

  // Fetch events whenever filters change
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        // 1. Start with events that are approved.
        let query = supabase.from('events').select('*').eq('approved', true);

        // 2. Apply filters for fields directly on events (date, category, designer).
        ['date', 'category', 'designer'].forEach((key) => {
          if (selectedFilters[key] && selectedFilters[key].length > 0) {
            const column = key === 'date' ? 'start_date' : key;
            query = query.in(column, selectedFilters[key]);
          }
        });

        // 3. For city and space filters (which live on the spaces table), query the spaces table first.
        let spaceIds = null;
        if (
          (selectedFilters.city && selectedFilters.city.length > 0) ||
          (selectedFilters.space && selectedFilters.space.length > 0)
        ) {
          let spacesQuery = supabase.from('spaces').select('id, city, name');
          if (selectedFilters.city && selectedFilters.city.length > 0) {
            spacesQuery = spacesQuery.in('city', selectedFilters.city);
          }
          if (selectedFilters.space && selectedFilters.space.length > 0) {
            spacesQuery = spacesQuery.in('name', selectedFilters.space);
          }
          const { data: spacesData, error: spacesError } = await spacesQuery;
          if (spacesError) {
            console.error('Error fetching spaces for filters:', spacesError);
            return;
          }
          spaceIds = spacesData.map((s) => s.id);
        }

        // 4. If we have space IDs, filter events by those IDs.
        if (spaceIds && spaceIds.length > 0) {
          query = query.in('space_id', spaceIds);
        } else if (
          (selectedFilters.city && selectedFilters.city.length > 0) ||
          (selectedFilters.space && selectedFilters.space.length > 0)
        ) {
          // If filters for city/space are set but no matching spaces found, then no events match.
          setEvents([]);
          return;
        }

        // 5. Execute the events query (newest submission first).
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) {
          console.error('Error fetching events:', error);
        } else {
          const today = new Date().toISOString().slice(0, 10);
          const filteredByScope = (data || []).filter((ev) => {
            const sd = ev.start_date ? ev.start_date.slice(0, 10) : null;
            const ed = ev.end_date ? ev.end_date.slice(0, 10) : null;
            if (!sd) return false;
            if (scope === 'all') {
              return true;
            }
            if (scope === 'upcoming') {
              return sd > today;
            }
            if (scope === 'current') {
              return ed ? sd <= today && ed >= today : sd === today;
            }
            if (scope === 'past') {
              return ed ? ed < today : sd < today;
            }
            return true;
          });

          const filteredBySearch = searchTermLower
            ? filteredByScope.filter((ev) => {
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
              })
            : filteredByScope;

          // Ensure newest-first by submission
          const sorted = filteredBySearch.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setEvents(sorted);
        }
      } catch (err) {
        console.error('Unexpected error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [selectedFilters, scope, searchTermLower]);

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

  function renderList() {
    return (
      <div className='divide-y divide-white/10'>
        {events.map((ev) => {
          const title = ev.title || 'Untitled event';
          const flyer = ev.flyer_url || ev.image_url || '';
          const spaceId = ev.space_id || null;
          const spaceName = ev.space_name || ev.venue || null;
          const city = ev.city || ev.space_city || '';
          const address = ev.address || ev.space_address || '';
          const locationStr = [spaceName, address, city]
            .filter(Boolean)
            .join(', ');
          const when = ev.start_date
            ? formatDateRange(
                ev.start_date,
                ev.end_date,
                ev.start_time,
                ev.end_time
              )
            : '';

          return (
            <div
              key={ev.id}
              className='flex gap-3 py-3'>
              <EAImage
                src={flyer}
                alt={title}
                width={64}
                height={64}
                sizes='64px'
                className='w-16 h-16 rounded object-cover'
              />
              <div className='flex-1 min-w-0'>
                {/* Title */}
                <div className='text-sm font-medium truncate'>{title}</div>

                {/* Location */}
                {spaceId && spaceName ? (
                  <div className='text-sm opacity-80 truncate'>
                    <Link
                      href={`/spaces/${spaceId}`}
                      className='underline'>
                      {spaceName}
                    </Link>
                    {address || city
                      ? `, ${[address, city].filter(Boolean).join(', ')}`
                      : ''}
                  </div>
                ) : (
                  <div className='text-sm opacity-80 truncate'>
                    {locationStr}
                  </div>
                )}

                {/* Dates */}
                {when && (
                  <div className='text-xs opacity-70 mt-0.5'>{when}</div>
                )}

                {/* Actions */}
                <div className='mt-2 flex gap-2'>
                  <button
                    className='button'
                    onClick={() => {
                      setSelected(ev);
                      setModalOpen(true);
                    }}>
                    Quick view
                  </button>
                  <Link
                    className='button'
                    href={`/events/${ev.slug || ev.id}`}>
                    More details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const scopeOptions = [
    { value: 'all', label: 'All', description: 'Every archived flyer' },
    { value: 'upcoming', label: 'Upcoming', description: 'Future events' },
    { value: 'current', label: 'Current', description: 'Happening now' },
    { value: 'past', label: 'Past', description: 'Archive history' },
  ];

  const viewOptions = [
    {
      value: 'grid',
      label: 'Grid view',
      icon: (
        <svg
          fill='currentColor'
          width='16'
          height='16'
          viewBox='0 0 18 18'
          aria-hidden='true'>
          <rect x='2' y='2' width='5' height='5' rx='1' />
          <rect x='11' y='2' width='5' height='5' rx='1' />
          <rect x='2' y='11' width='5' height='5' rx='1' />
          <rect x='11' y='11' width='5' height='5' rx='1' />
        </svg>
      ),
    },
    {
      value: 'list',
      label: 'List view',
      icon: (
        <svg
          fill='currentColor'
          width='16'
          height='16'
          viewBox='0 0 18 18'
          aria-hidden='true'>
          <rect x='2' y='3' width='14' height='2' rx='1' />
          <rect x='2' y='8' width='14' height='2' rx='1' />
          <rect x='2' y='13' width='14' height='2' rx='1' />
        </svg>
      ),
    },
  ];

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
            The living archive of event graphics
          </h1>
          <p className='home-hero__body'>
            Discover independent parties, exhibitions, and gatherings through the flyers that announced them. Filter by city, designer, or mood—then dive into the spaces that keep the scene alive.
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
          aria-label='Event scope and layout'>
          <div
            className='filter-rail__scopes'
            role='group'
            aria-label='Event timeframe'>
            {scopeOptions.map((option) => (
              <button
                key={option.value}
                type='button'
                aria-pressed={scope === option.value}
                onClick={() => setScope(option.value)}
                aria-label={`${option.label} · ${option.description}`}>
                {option.label}
              </button>
            ))}
          </div>
          <div
            className='filter-rail__views'
            role='group'
            aria-label='Result layout'>
            {viewOptions.map((option) => (
              <button
                key={option.value}
                type='button'
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}>
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters ? (
          <div className='filter-rail__chips'>
            <div className='filter-rail__summary' aria-live='polite'>
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
                  <span className='filter-chip__remove' aria-hidden='true'>×</span>
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
          <div className='filter-rail__summary' aria-live='polite'>
            <span>No filters applied</span>
            <span className='filter-rail__count'>0</span>
          </div>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : view === 'grid' ? (
        <div onClickCapture={handleGridClick}>
          <MasonryGrid items={events} />
        </div>
      ) : (
        renderList()
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
