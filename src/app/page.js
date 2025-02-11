'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      let query = supabase.from('events').select('*');

      // Read filters from URL params
      const city = searchParams.get('city');
      const category = searchParams.get('category');
      const space = searchParams.get('space');
      const designer = searchParams.get('designer');

      // Apply filters dynamically
      if (city) query = query.eq('city', city);
      if (category) query = query.eq('category', category);
      if (space) query = query.eq('space', space);
      if (designer) query = query.eq('designer', designer);

      const { data } = await query;
      setEvents(data || []);
    }

    fetchEvents();
  }, [searchParams]); // Run effect when URL params change

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
                src={event.image_url || '/placeholder.jpg'}
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
