'use client';

import { useContext, useEffect, useState } from 'react';
import { FilterContext } from '@/contexts/FilterContext';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomePage() {
  // Use selectedFilters from the context instead of filters
  const { selectedFilters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      let query = supabase.from('events').select('*');

      // Use a fallback {} so Object.entries doesn't fail
      Object.entries(selectedFilters || {}).forEach(([key, value]) => {
        // For multi-select filters, check if the array has any values
        if (Array.isArray(value) && value.length > 0) {
          query = query.in(key, value);
        }
      });

      const { data, error } = await query;
      if (error) console.error(error);
      else setEvents(data || []);
    }
    fetchEvents();
  }, [selectedFilters]);

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 px-6'>
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}>
            <div className='cursor-pointer bg-gray-800 rounded-lg overflow-hidden hover:opacity-80 transition'>
              <img
                src={event.image_url || '/placeholder.jpg'}
                alt={event.title}
                className='w-full h-auto'
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
