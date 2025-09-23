'use client';

import { useContext, useEffect, useState } from 'react';
import { FilterContext } from '@/contexts/FilterContext';
import { supabase } from '@/lib/supabaseClient';
import MasonryGrid from '@/components/MasonryGrid';
import Spinner from '@/components/Spinner';
import Link from 'next/link';
import Modal from '@/components/Modal';
import EventQuickView from '@/components/EventQuickView';
import EAImage from '@/components/EAImage';

export default function HomePage() {
  const { selectedFilters, setSelectedFilters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all'); // 'all' | 'upcoming' | 'current' | 'past'
  const [cities, setCities] = useState([]);
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchCities() {
      const { data, error } = await supabase.from('spaces').select('city');
      if (error) {
        console.error('Error fetching cities:', error);
        return;
      }
      const unique = Array.from(
        new Set((data || []).map((d) => d.city).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      setCities(unique);
    }
    fetchCities();
  }, []);

  // Helper function to remove a single value from a multi-select filter
  function removeFilterValue(filterKey, value) {
    setSelectedFilters((prev) => {
      const updated = { ...prev };
      // Filter out the clicked value
      const newValues = (updated[filterKey] || []).filter((v) => v !== value);
      updated[filterKey] = newValues;
      return updated;
    });
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

          // Ensure newest-first by submission
          const sorted = filteredByScope.sort(
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
  }, [selectedFilters, scope]);

  // Render a top bar showing active filters
  function renderFilterBar() {
    // Flatten all filter values into a single array of {key, value} pairs
    const activeFilterPairs = [];
    Object.entries(selectedFilters).forEach(([filterKey, filterValues]) => {
      if (Array.isArray(filterValues) && filterValues.length > 0) {
        filterValues.forEach((val) => {
          activeFilterPairs.push({ filterKey, val });
        });
      }
    });

    return (
      <div className='filter-bar'>
        {activeFilterPairs.map(({ filterKey, val }, idx) => (
          <button
            key={`${filterKey}-${val}-${idx}`}
            onClick={() => removeFilterValue(filterKey, val)}
            className='button'>
            <span>×</span>
            <span className='uppercase'>{val}</span>
          </button>
        ))}
      </div>
    );
  }

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
        {events.map((ev) => (
          <div
            key={ev.id}
            className='flex gap-3 py-3'>
            <EAImage
              src={ev.flyer_url || ev.image_url}
              alt={ev.title || 'Event flyer'}
              width={64}
              height={64}
              sizes='64px'
              className='w-16 h-16 rounded object-cover'
            />
            <div className='flex-1 min-w-0'>
              <div className='text-sm font-medium truncate'>
                {ev.title || 'Untitled event'}
              </div>
              <div className='text-sm opacity-80 truncate'>
                {ev.city || ev.space_city || ''}
                {ev.city && (ev.space_name || ev.venue) ? ' · ' : ''}
                {ev.space_name || ev.venue || ''}
              </div>
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
                  className='underline text-sm'
                  href={`/events/${ev.slug || ev.id}`}>
                  Open
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='w-full'>
      {/* Scope tabs + City dropdown */}
      <div className='mb-3 flex items-center gap-20 '>
        <div className='flex gap-2'>
          <button
            onClick={() => setScope('all')}
            className={`button ${
              scope === 'all'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : ''
            }`}>
            ALL
          </button>
          <button
            onClick={() => setScope('upcoming')}
            className={`button ${
              scope === 'upcoming'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : ''
            }`}>
            UPCOMING
          </button>
          <button
            onClick={() => setScope('current')}
            className={`button ${
              scope === 'current'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : ''
            }`}>
            CURRENT
          </button>
          <button
            onClick={() => setScope('past')}
            className={`button ${
              scope === 'past'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : ''
            }`}>
            PAST
          </button>
        </div>
        <div className='ml-auto flex gap-2'>
          <button
            onClick={() => setView('grid')}
            className={`button ${
              view === 'grid'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : ''
            }`}
            aria-pressed={view === 'grid'}>
            grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`button ${
              view === 'list'
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : ''
            }`}
            aria-pressed={view === 'list'}>
            list
          </button>
        </div>

        {/* <select
          className='input ml-auto'
          value={(selectedFilters.city && selectedFilters.city[0]) || ''}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedFilters((prev) => ({
              ...prev,
              city: val ? [val] : [],
            }));
          }}>
          <option value=''>Cities</option>
          {cities.map((c) => (
            <option
              key={c}
              value={c}>
              {c}
            </option>
          ))}
        </select> */}
      </div>

      {/* Filter Bar at the top */}
      {renderFilterBar()}

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
