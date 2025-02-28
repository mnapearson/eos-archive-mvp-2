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
  const { selectedFilters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);

      try {
        // 1. Start with events that are approved.
        let query = supabase.from('events').select('*').eq('approved', true);

        // 2. Apply filters for fields that are directly on events (date, category, designer).
        ['date', 'category', 'designer'].forEach((key) => {
          if (selectedFilters[key] && selectedFilters[key].length > 0) {
            query = query.in(key, selectedFilters[key]);
          }
        });

        // 3. For city and space filters (which live on the spaces table), first query the spaces table.
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

        // 4. If we have a list of space IDs, filter events by those IDs.
        if (spaceIds && spaceIds.length > 0) {
          query = query.in('space_id', spaceIds);
        } else if (
          (selectedFilters.city && selectedFilters.city.length > 0) ||
          (selectedFilters.space && selectedFilters.space.length > 0)
        ) {
          // If filters are set for city/space but no matching spaces found, then no events match.
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

  return (
    <div className='max-w-6xl mx-auto'>
      {loading ? <Spinner /> : <MasonryGrid items={events} />}
    </div>
  );
}
