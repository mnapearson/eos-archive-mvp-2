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
      let query = supabase.from('events').select('*');

      // Apply multi-select filters if values exist
      Object.entries(selectedFilters || {}).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          query = query.in(key, value);
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
    <div className='max-w-6xl mx-auto px-6 mt-6'>
      <MasonryGrid items={events} />
    </div>
  );
}
