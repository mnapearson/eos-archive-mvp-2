'use client';

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import MapComponent from '@/components/MapComponent';
import { FilterContext } from '@/contexts/FilterContext';
import Head from 'next/head';
import ShareButton from '@/components/ShareButton';

// Format the date/time: "DD.MM.YY @ HH.MM"
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

export default function EventPage() {
  const { id } = useParams();
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
        if (!id) return;
        const response = await fetch(`/api/events/${id}`);
        const data = await response.json();

        // If no space address, attempt reverse geocoding:
        if (data.space && !data.space.address) {
          const { latitude, longitude } = data.space;
          if (latitude && longitude) {
            try {
              const geoRes = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
              );
              const geoData = await geoRes.json();
              if (geoData.features && geoData.features.length > 0) {
                setSpaceAddress(geoData.features[0].place_name);
              } else {
                setSpaceAddress('UNKNOWN ADDRESS');
              }
            } catch (error) {
              console.error('Reverse geocoding error:', error);
              setSpaceAddress('UNKNOWN ADDRESS');
            }
          }
        }
        setEvent(data);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (loading) {
    return <Spinner />;
  }

  if (!event) {
    return (
      <div className='py-20 px-4 text-center'>
        <p className='text-sm text-gray-500'>Event not found.</p>
      </div>
    );
  }

  // Basic info
  const eventTitle = event.title || 'Untitled';
  // Use original values for filtering
  const eventCategory = event.category || '—';
  const eventDesigner = event.designer || '-';
  const eventDateTime = formatDateTime(event.date, event.time);
  const displayedAddress =
    event.space?.address ||
    spaceAddress ||
    event.space?.city ||
    'UNKNOWN ADDRESS';
  // Function to handle filter clicks:
  const handleFilterClick = (filterKey, value) => {
    // Update the global filter context. Here we override the filter for that key.
    setSelectedFilters((prev) => ({ ...prev, [filterKey]: [value] }));
    router.push('/');
  };

  // Toggle the map overlay
  const toggleMap = () => setMapOpen((prev) => !prev);

  return (
    <>
      <Head>
        <title>{event.title} - eos archive</title>
        <meta
          property='og:title'
          content={event.title}
        />
        <meta
          property='og:description'
          content={event.description}
        />
        <meta
          property='og:image'
          content={event.image_url}
        />
        <meta
          property='og:url'
          content={`https://eosarchivemvp.netlify.app/events/${event.id}`}
        />
        <meta
          name='twitter:card'
          content='summary_large_image'
        />
      </Head>

      {/* Container for entire layout */}
      <div className='flex flex-col'>
        {/* Return to archive link */}
        <div>
          <Link
            href='/'
            className='text-sm hover:underline'>
            ← return to archive
          </Link>
        </div>

        {/* Two-column layout */}
        <div className='flex flex-col md:flex-row flex-1 '>
          {/* Left column: Flyer/Image */}
          <div className='md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8'>
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

          {/* Right column: text details */}
          <div className='md:w-1/2 p-4 md:p-8 space-y-4 flex flex-col'>
            {/* EVENT TITLE */}
            <div>
              <p className='whitespace-pre-line'>{eventTitle}</p>
            </div>

            {/* DATE */}
            <div>
              <h3 className='uppercase text-xs font-bold mb-1'>Date</h3>
              <button
                onClick={() => handleFilterClick('date', event.date)}
                className='hover:underline'>
                {eventDateTime}
              </button>
            </div>

            {/* CATEGORY */}
            <div>
              <h3 className='uppercase text-xs font-bold mb-1'>Category</h3>
              <button
                onClick={() => handleFilterClick('category', eventCategory)}
                className='hover:underline'>
                {eventCategory}
              </button>
            </div>

            {/* SPACE NAME */}
            <div>
              <h3 className='uppercase text-xs font-bold mb-1'>Space</h3>
              {event.space ? (
                <Link
                  href={`/spaces/${event.space.id}`}
                  className='hover:underline'>
                  {event.space.name || 'UNKNOWN SPACE'}
                </Link>
              ) : (
                <p>UNKNOWN SPACE</p>
              )}
            </div>

            {/* ADDRESS */}
            <div>
              <h3 className='uppercase text-xs font-bold mb-1'>Address</h3>
              <button
                onClick={toggleMap}
                className='hover:underline text-left'>
                {displayedAddress}
              </button>
            </div>

            {/* DESCRIPTION */}
            <div>
              <h3 className='uppercase text-xs font-bold mb-1'>Description</h3>
              <p className='whitespace-pre-line leading-relaxed'>
                {event.description || 'No description provided.'}
              </p>
            </div>

            {/* DESIGNER */}
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
              text={`Event: ${event.title}\nDate: ${event.date} @ ${event.time}\nCategory: ${event.category}`}
              url={`https://eosarchivemvp.netlify.app/events/${event.id}`}
              buttonText='SHARE'
              className='uppercase tracking-wide border border-[var(--foreground)] px-4 py-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition'
            />
          </div>
        </div>
      </div>

      {/* Slide-out Map Panel */}
      {mapOpen && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          {/* Semi-transparent overlay */}
          <div
            className='absolute inset-0 bg-[var(--background)]/80 backdrop-blur-md'
            onClick={toggleMap}
            aria-hidden='true'
          />
          {/* Slide-out panel from the right */}
          <div className='relative z-20 w-80 md:w-96 h-full bg-[var(--background)]/90 backdrop-blur-md flex flex-col transition-transform duration-300 border-l border-[var(--foreground)]'>
            <button
              className='absolute top-2 left-2 text-lg z-30 px-2 py-1 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition'
              onClick={toggleMap}
              aria-label='Close map'>
              Close
            </button>
            <MapComponent
              eventId={id}
              address={displayedAddress}
            />
          </div>
        </div>
      )}
    </>
  );
}
