'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function formatDateTime(dateString, timeString) {
  if (!dateString) return '';
  const dateObj = new Date(dateString);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  let timePart = '';
  if (timeString) {
    const segments = timeString.split(':');
    if (segments.length >= 2) {
      timePart = `${segments[0]}.${segments[1]}`;
    } else {
      timePart = timeString;
    }
  }
  return timePart
    ? `${day}.${month}.${year} @ ${timePart}`
    : `${day}.${month}.${year}`;
}

export default function SpacePage() {
  const { id } = useParams();
  const [space, setSpace] = useState(null);
  const [events, setEvents] = useState([]);
  // At the top of your component, add state for the view mode:
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    async function fetchSpaceDetails() {
      if (!id) return;
      // Fetch the space details by id.
      const resSpace = await fetch(`/api/spaces/${id}`);
      const dataSpace = await resSpace.json();
      setSpace(dataSpace);

      // Fetch events associated with this space that are approved.
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
    return <p className='p-16'>Loading space details...</p>;
  }

  return (
    <div className='max-w-screen-lg mx-auto p-4'>
      <Link
        href='/map'
        className='underline text-sm'>
        ← Back to Spaces
      </Link>
      <div className='mt-4'>
        <h1 className='text-3xl font-bold'>{space.name}</h1>
        {space.featured_image && (
          <img
            src={space.featured_image}
            alt={space.name}
            className='w-full h-auto rounded-md mt-2'
          />
        )}
        {space.description && (
          <p className='mt-2 text-sm'>{space.description}</p>
        )}
        {space.website && (
          <p className='mt-2'>
            <a
              href={space.website}
              target='_blank'
              rel='noopener noreferrer'
              className='underline text-sm'>
              Visit Website
            </a>
          </p>
        )}
        <div className='mt-4'>
          <MapComponent spaces={[space]} />
        </div>
        <div className='mt-8'>
          <h2 className='text-2xl font-semibold'>Events at {space.name}</h2>

          {/* Toggle between List and Flyer views */}
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
              onClick={() => setViewMode('flyer')}
              className={`px-3 py-1 text-xs border rounded ${
                viewMode === 'flyer'
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-transparent text-[var(--foreground)]'
              }`}>
              FLYER VIEW
            </button>
          </div>

          {events.length > 0 ? (
            viewMode === 'list' ? (
              // List view: text-based event details
              <ul className='space-y-2'>
                {events.map((event) => (
                  <li
                    key={event.id}
                    className='border-b border-gray-300 pb-2'>
                    <Link
                      href={`/events/${event.id}`}
                      className='underline text-sm'>
                      {event.title}
                    </Link>
                    <p className='text-xs'>
                      {formatDateTime(event.date, event.time)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              // Flyer view: grid of clickable event images
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
            <p className='text-sm italic'>
              No approved events found for this space.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
