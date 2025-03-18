'use client';

import { useContext, useEffect, useState } from 'react';
import { FilterContext } from '@/contexts/FilterContext';
import { createClient } from '@supabase/supabase-js';
import MasonryGrid from '@/components/MasonryGrid';
import Spinner from '@/components/Spinner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomePage() {
  const { selectedFilters, setSelectedFilters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
            query = query.in(key, selectedFilters[key]);
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

        // 5. Execute the events query.
        const { data, error } = await query;
        if (error) {
          console.error('Error fetching events:', error);
        } else {
          setEvents(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [selectedFilters]);

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
      <div className='py-2 px-4 text-sm flex items-center flex-wrap gap-2'>
        {/* <button
          onClick={() =>
            setSelectedFilters({
              city: [],
              space: [],
              date: [],
              category: [],
              designer: [],
            })
          }
          className='text-gray-500'>
          ARCHIVE
        </button> */}
        {activeFilterPairs.map(({ filterKey, val }, idx) => (
          <button
            key={`${filterKey}-${val}-${idx}`}
            onClick={() => removeFilterValue(filterKey, val)}
            className='flex items-center gap-1 px-3 py-1 text-xs rounded border border-[var(--foreground)] bg-transparent text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition'>
            <span className='uppercase'>{val}</span>
            <span>×</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto'>
      {/* Filter Bar at the top */}
      {renderFilterBar()}

      {loading ? <Spinner /> : <MasonryGrid items={events} />}
    </div>
  );
}
