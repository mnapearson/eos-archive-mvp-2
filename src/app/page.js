'use client';

import { useState, useEffect, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { FilterContext } from '@/contexts/FilterContext';
import { EventList } from '@/components/EventList';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomePage() {
  const { filters } = useContext(FilterContext);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      let query = supabase.from('events').select('*');

      // Append filters to the query only if a value is selected
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query = query.eq(key, value);
      });

      const { data } = await query;
      setEvents(data || []);
    }

    fetchEvents();
  }, [filters]);

  return (
    <div className='max-w-6xl mx-auto'>
      {/* Event Grid */}
      <section className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 px-6'>
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}>
            <div className='cursor-pointer bg-gray-800 rounded-lg overflow-hidden hover:opacity-80 transition'>
              <img
                src={event.image_url || '/placeholder.jpg'} // Fallback if image is missing
                alt={event.title}
                className='w-full h-auto'
              />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
