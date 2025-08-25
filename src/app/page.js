'use client';

import { useContext, useEffect, useState } from 'react';
import { FilterContext } from '@/contexts/FilterContext';
import { supabase } from '@/lib/supabaseClient';
import MasonryGrid from '@/components/MasonryGrid';
import Spinner from '@/components/Spinner';

export default function HomePage() {
  const { selectedFilters, setSelectedFilters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all'); // 'all' | 'upcoming' | 'current' | 'past'
  const [cities, setCities] = useState([]);

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

      {loading ? <Spinner /> : <MasonryGrid items={events} />}
    </div>
  );
}
