'use client';

import Link from 'next/link';
import { useEffect, useState, useContext } from 'react';
import { FilterContext } from '@/contexts/FilterContext';

export default function EventList() {
  const [events, setEvents] = useState([]);
  const { filters } = useContext(FilterContext);

  useEffect(() => {
    async function fetchEvents() {
      // Build query parameters based on active filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      const url = `/api/events${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url);
      const data = await response.json();
      setEvents(data);
    }
    fetchEvents();
  }, [filters]);

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
