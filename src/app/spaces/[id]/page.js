'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDateTime } from '@/utils/dateTime';
import MapComponent from '@/components/MapComponent';
import SpaceListItem from '@/components/SpaceListItem';
import { createClient } from '@supabase/supabase-js';
import Spinner from '@/components/Spinner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SpacePage() {
  const { id } = useParams();
  const [space, setSpace] = useState(null);
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState('flyers');

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
    <div className='max-w-screen-lg mx-auto'>
      <Link
        href='/map'
        className='text-sm hover:text-gray-600'>
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
        <div className='mt-8'>
          <h2 className='font-semibold'>{space.name} event archive</h2>
          <div className='mt-2 mb-4 flex gap-2'>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs border rounded ${
                viewMode === 'list'
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-transparent text-[var(--foreground)]'
              }`}>
              LIST VIEW
            </button>
            <button
              onClick={() => setViewMode('flyers')}
              className={`px-3 py-1 text-xs border rounded ${
                viewMode === 'flyers'
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-transparent text-[var(--foreground)]'
              }`}>
              FLYER VIEW
            </button>
          </div>

          {events.length > 0 ? (
            viewMode === 'list' ? (
              <ul className='space-y-2'>
                {events.map((event) => (
                  <li
                    key={event.id}
                    className='border-b border-gray-200 pb-2'>
                    <Link
                      href={`/events/${event.id}`}
                      className='underline text-sm'>
                      {event.title}
                    </Link>
                    <p className='text-sm italic mb-1'>{event.category}</p>
                    <p className='text-sm mb-1'>
                      {formatDateTime(event.date, event.time)}
                    </p>
                    <p className='text-sm'>{event.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}>
                    <div className='cursor-pointer'>
                      <img
                        src={event.image_url || '/placeholder.jpg'}
                        alt={event.title}
                        className='w-full h-auto rounded shadow'
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <p className='text-sm italic'>No events found for this space.</p>
          )}
        </div>
      </div>
    </div>
  );
}
