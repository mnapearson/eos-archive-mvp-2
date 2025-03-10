'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';

export default function SpacePage() {
  const { id } = useParams();
  const [space, setSpace] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchSpaceDetails() {
      // Fetch the space details by id.
      const resSpace = await fetch(`/api/spaces/${id}`);
      const dataSpace = await resSpace.json();
      setSpace(dataSpace);

      // Fetch events associated with this space (approved events).
      const resEvents = await fetch(`/api/events?space_id=${id}&approved=true`);
      const dataEvents = await resEvents.json();
      setEvents(dataEvents);
    }
    if (id) {
      fetchSpaceDetails();
    }
  }, [id]);

  if (!space) return <p>Loading space details...</p>;

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
          {events.length > 0 ? (
            <ul className='mt-2 space-y-2'>
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className='underline text-sm'>
                    {event.title}
                  </Link>
                  <p className='text-xs'>
                    {event.date} {event.time}
                  </p>
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
