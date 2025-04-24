// src/app/events/[id]/EventPageClient.js
'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import MapComponent from '@/components/MapComponent';
import { FilterContext } from '@/contexts/FilterContext';
import ShareButton from '@/components/ShareButton';
import { formatDateRange } from '@/lib/date';

export default function EventPageClient({ eventId }) {
  const router = useRouter();
  const { setSelectedFilters } = useContext(FilterContext);
  const [event, setEvent] = useState(null);
  const [spaceAddress, setSpaceAddress] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        setEvent(data);

        // optional reverse‐geocoding logic…
        if (
          data.space &&
          !data.space.address &&
          data.space.latitude &&
          data.space.longitude
        ) {
          try {
            const geoRes = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${data.space.longitude},${data.space.latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            const geoData = await geoRes.json();
            setSpaceAddress(
              geoData.features?.[0]?.place_name || 'UNKNOWN ADDRESS'
            );
          } catch {
            setSpaceAddress('UNKNOWN ADDRESS');
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  if (loading) return <Spinner />;
  if (!event)
    return (
      <div className='py-20 px-4 text-center'>
        <p className='text-sm text-gray-500'>Event not found.</p>
      </div>
    );

  // Prepare display values
  const eventTitle = event.title || 'Untitled';
  const eventCategory = event.category || '—';
  const eventDesigner = event.designer || '-';
  const eventDateTime = formatDateRange(
    event.start_date,
    event.end_date,
    event.start_time,
    event.end_time
  );
  const displayedAddress =
    event.space?.address ||
    spaceAddress ||
    event.space?.city ||
    'UNKNOWN ADDRESS';

  const handleFilterClick = (key, val) => {
    setSelectedFilters((prev) => ({ ...prev, [key]: [val] }));
    router.push('/');
  };
  const toggleMap = () => setMapOpen((prev) => !prev);

  return (
    <div className='flex flex-col'>
      <Link
        scroll={false}
        href='/'
        className='text-sm hover:underline mb-4'>
        ← return to archive
      </Link>

      <div className='flex flex-col md:flex-row flex-1'>
        {/* Flyer */}
        <div className='md:w-1/2 flex items-center justify-center p-4 md:p-8'>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={`Flyer for ${eventTitle}`}
              className='max-w-full max-h-full object-contain'
            />
          ) : (
            <p className='italic text-gray-600'>No flyer available</p>
          )}
        </div>

        {/* Details */}
        <div className='md:w-1/2 p-4 md:p-8 space-y-4 flex flex-col'>
          <h1 className='text-2xl font-bold'>{eventTitle}</h1>

          <div>
            <h3 className='uppercase text-xs font-bold mb-1'>Date</h3>
            <button
              onClick={() => handleFilterClick('date', event.start_date)}
              className='hover:underline'>
              {eventDateTime}
            </button>
          </div>

          <div>
            <h3 className='uppercase text-xs font-bold mb-1'>Category</h3>
            <button
              onClick={() => handleFilterClick('category', eventCategory)}
              className='hover:underline'>
              {eventCategory}
            </button>
          </div>

          <div>
            <h3 className='uppercase text-xs font-bold mb-1'>Space</h3>
            {event.space ? (
              <Link
                href={`/spaces/${event.space.id}`}
                className='hover:underline'>
                {event.space.name}
              </Link>
            ) : (
              <p>UNKNOWN SPACE</p>
            )}
          </div>

          <div>
            <h3 className='uppercase text-xs font-bold mb-1'>Address</h3>
            <button
              onClick={toggleMap}
              className='hover:underline text-left'>
              {displayedAddress}
            </button>
          </div>

          <div>
            <h3 className='uppercase text-xs font-bold mb-1'>Description</h3>
            <p className='whitespace-pre-line leading-relaxed'>
              {event.description || 'No description provided.'}
            </p>
          </div>

          <div>
            <h3 className='uppercase text-xs font-bold mb-1'>Flyer Design</h3>
            <button
              onClick={() => handleFilterClick('designer', eventDesigner)}
              className='hover:underline'>
              {eventDesigner}
            </button>
          </div>

          <ShareButton
            title={eventTitle}
            text={`${event.space?.name || ''} · ${eventDateTime}`}
            buttonText='Share'
            className='uppercase tracking-wide border border-[var(--foreground)] px-4 py-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition'
          />
        </div>
      </div>

      {mapOpen && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          <div
            className='absolute inset-0 bg-[var(--background)]/80 backdrop-blur-md'
            onClick={toggleMap}
            aria-hidden='true'
          />
          <div className='relative z-20 w-80 md:w-96 h-full bg-[var(--background)]/90 backdrop-blur-md flex flex-col border-l border-[var(--foreground)]'>
            <button
              onClick={toggleMap}
              className='absolute top-2 left-2 px-2 py-1 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition'>
              Close
            </button>
            <MapComponent
              eventId={eventId}
              address={displayedAddress}
            />
          </div>
        </div>
      )}
    </div>
  );
}
