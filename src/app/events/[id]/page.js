'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MapComponent from '@/components/MapComponent';
import Link from 'next/link';

export default function EventPage() {
  const { id } = useParams(); // ✅ Fix: Use useParams() instead of accessing params directly
  const [event, setEvent] = useState(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return; // Ensure id exists before fetching

      const response = await fetch(`/api/events/${id}`);
      const data = await response.json();
      setEvent(data);
    }

    fetchEvent();
  }, [id]);

  if (!event) return <p>Loading event details...</p>;

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='mb-10 flex flex-col gap-4'>
        <Link
          href='/'
          className='hover:underline'>
          return to archive
        </Link>
      </div>
      <h1 className='text-2xl font-semibold mb-4'>{event.title}</h1>
      {/* Display Event Flyer */}
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={`Flyer for ${event.title}`}
          className='w-full h-auto rounded-lg shadow'
        />
      ) : (
        <p className='text-gray-500'>No flyer available</p>
      )}
      <p className='mb-2'>
        <strong>Date:</strong> {event.date} {event.time}
      </p>
      <p className='mb-2'>
        <strong>Location:</strong> {event.space}, {event.city}
      </p>
      <p className='mb-4'>{event.description}</p>

      {/* Event Map */}
      <MapComponent eventId={id} />
    </div>
  );
}
