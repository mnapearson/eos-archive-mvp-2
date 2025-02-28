'use client';

import { useContext, useEffect, useState } from 'react';
import { FilterContext } from '@/contexts/FilterContext';
import { createClient } from '@supabase/supabase-js';
import MasonryGrid from '@/components/MasonryGrid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomePage() {
  const { selectedFilters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      // Perform an inner join between events and spaces.
      // The syntax "spaces!inner(city, name)" tells Supabase to join
      // the related record from the "spaces" table.
      let query = supabase.from('events').select('*, spaces!inner(city, name)');

      // Apply filters – for "city" and "space" we refer to the joined fields.
      Object.entries(selectedFilters || {}).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          if (key === 'city') {
            query = query.in('spaces.city', value);
          } else if (key === 'space') {
            query = query.in('spaces.name', value);
          } else {
            query = query.in(key, value);
          }
        }
      });

      const { data, error } = await query;
      if (error) {
        console.error(error);
      } else {
        setEvents(data || []);
      }
    }
    fetchEvents();
  }, [selectedFilters]);

  return (
    <div className='max-w-6xl mx-auto'>
      <MasonryGrid items={events} />
    </div>
  );
}
