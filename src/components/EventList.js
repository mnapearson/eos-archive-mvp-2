'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EventList() {
  const [events, setEvents] = useState([]);

  // Fetch events from Supabase API
  useEffect(() => {
    async function fetchEvents() {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    }
    fetchEvents();
  }, []);

  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-6'>events in the archive</h1>

      <div className='space-y-4'>
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}>
            <div className='cursor-pointer p-4 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition rounded'>
              <h2 className='text-xl font-semibold'>{event.title}</h2>
              <p className='text-sm'>
                {event.date} {event.time} — {event.city}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
