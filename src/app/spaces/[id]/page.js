'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import SpaceListItem from '@/components/SpaceListItem';
import { createClient } from '@supabase/supabase-js';
import Spinner from '@/components/Spinner';
import { formatDateRange } from '@/lib/metadata';
import { supabase } from '@/lib/supabaseClient';

export default function SpacePage() {
  const { id } = useParams();
  const [space, setSpace] = useState(null);
  const [events, setEvents] = useState([]);

  // Local filter and sort state
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Derive unique categories from fetched events
  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean))),
    [events]
  );

  const displayEvents = useMemo(() => {
    const today = new Date();
    let evs = events;

    // Category filter, if any
    if (categoryFilter) {
      evs = evs.filter((e) => e.category === categoryFilter);
    }

    // Keep only events whose end_date (or start_date) is today or in future
    evs = evs.filter((e) => {
      const end = e.end_date ? new Date(e.end_date) : new Date(e.start_date);
      return end >= today;
    });

    // Sort ascending by start_date
    return evs
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [events, categoryFilter]);

  useEffect(() => {
    async function fetchSpaceDetails() {
      if (!id) return;
      // Fetch the space details by id.
      const resSpace = await fetch(`/api/spaces/${id}`);
      const dataSpace = await resSpace.json();
      setSpace(dataSpace);

      // Fetch approved events associated with this space.
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('approved', true)
        .eq('space_id', id);
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(eventsData || []);
      }
    }
    if (id) {
      fetchSpaceDetails();
    }
  }, [id]);

  if (!space) {
    return <Spinner />;
  }

  return (
    <div>
      <Link
        href='/map'
        className='text-sm hover:text-gray-600'
        scroll={false}>
        ← return to spaces map
      </Link>
      <div className='mt-4'>
        {/* Use the reusable SpaceListItem in detailed mode */}
        <SpaceListItem
          space={space}
          detailed={true}
        />
        <div className='mt-4'>
          <MapComponent spaces={[space]} />
        </div>
        <div className='mb-8'>
          <h2 className='font-semibold mb-6'>{space.name} events</h2>

          {/* Filter and sort controls */}
          <div className='mt-4 mb-4 flex flex-wrap items-center gap-4 justify-between'>
            {/* Category filters */}
            <div className='flex flex-wrap items-center gap-2'>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setCategoryFilter(categoryFilter === cat ? null : cat)
                  }
                  className={`button ${
                    categoryFilter === cat
                      ? 'bg-[var(--accent)] text-[var(--background)]'
                      : ''
                  }`}>
                  {cat}
                  {categoryFilter === cat && (
                    <span className='ml-1'>&times;</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {events.length > 0 ? (
            <ul className='space-y-4'>
              {displayEvents.map((event) => (
                <li
                  key={event.id}
                  className='flex flex-col md:flex-row items-start gap-2 pb-4 border-b border-[var(--foreground)]'>
                  <div className='w-1/3'>
                    <img
                      src={event.image_url || '/placeholder.jpg'}
                      alt={event.title}
                      className='w-full max-w-xs h-auto rounded shadow'
                    />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <Link
                      href={`/events/${event.id}`}
                      className='underline text-lg font-semibold'>
                      {event.title}
                    </Link>
                    <p className='text-sm italic'>{event.category}</p>
                    <p className='text-sm mb-1'>
                      {formatDateRange(
                        event.start_date,
                        event.end_date,
                        event.start_time,
                        event.end_time
                      )}
                    </p>
                    <p className='text-sm'>{event.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm italic'>No events found for this space.</p>
          )}
        </div>
      </div>
    </div>
  );
}
