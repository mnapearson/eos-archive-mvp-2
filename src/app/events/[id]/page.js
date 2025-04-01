'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MapComponent from '@/components/MapComponent';
import Link from 'next/link';
import Spinner from '@/components/Spinner';

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
  const [event, setEvent] = useState(null);
  // We'll store a "spaceAddress" if reverse geocoding is needed.
  const [spaceAddress, setSpaceAddress] = useState('');
  // Controls whether the map panel is visible.
  const [mapOpen, setMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      try {
        if (!id) return;
        const response = await fetch(`/api/events/${id}`);
        const data = await response.json();

        // If the API returns a nested space without an address, do reverse geocoding.
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

  if (!event) {
    return <Spinner />;
  }

  // Use joined space data if available.
  const eventTitle = (event.title || 'UNTITLED').toUpperCase();
  const eventCategory = event.category || '';
  const eventDesigner = event.designer || '';
  const dateTimeDisplay = formatDateTime(event.date, event.time);
  const eventDescription =
    event.description ||
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tincidunt vehicula turpis.';
  // Display address: prefer a stored address; otherwise use reverse-geocoded spaceAddress; or fallback to the space's city.
  const displayedAddress =
    event.space?.address ||
    spaceAddress ||
    event.space?.city ||
    'UNKNOWN ADDRESS';

  const handleShare = async (e) => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: 'Check out this event I found on eos archive.',
          url: window.location.href,
        });
      } catch (error) {
        // Do nothing if user cancels.
      }
    } else {
      alert('Sharing not supported in this browser.');
    }
  };

  // Toggle the map panel open/closed.
  const toggleMap = () => setMapOpen((prev) => !prev);

  return (
    <div>
      {/* Return Link */}
      <div className='mb-4'>
        <Link
          href='/'
          className='text-sm hover:text-gray-600'>
          ← return to archive
        </Link>
      </div>

      {/* Two-column layout for event details */}
      <div className='flex flex-col md:flex-row gap-8 mb-8'>
        {/* Left Column: Flyer */}
        <div className='md:w-2/3'>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={`Flyer for ${event.title}`}
              className='w-full h-auto rounded-lg shadow'
            />
          ) : (
            <p className='text-gray-500'>No flyer available</p>
          )}
          <p className='text-[var(--foreground)] italic mt-1'>
            design: {event.designer}
          </p>
        </div>
        {/* Right Column: Event Info */}
        <div className='md:w-1/4 flex flex-col justify-between'>
          <div>
            <div className='mb-1'>
              <h1 className='font-bold'>{eventTitle}</h1>{' '}
              {/* Make the space name clickable to open the map panel */}
              {event.space && (
                <p
                  className='text-sm mb-4 cursor-pointer underline hover:text-gray-400'
                  onClick={toggleMap}>
                  {event.space.name}, {event.space.city}
                </p>
              )}
            </div>
            <p className='text-sm italic mb-2'>{eventCategory}</p>
            {dateTimeDisplay && (
              <p className='text-sm mb-2'>{dateTimeDisplay}</p>
            )}
            <p className='text-sm whitespace-pre-line mb-6'>
              {eventDescription}
            </p>{' '}
            <Link
              href='#'
              onClick={handleShare}
              className='glow-button'>
              SHARE
            </Link>
          </div>{' '}
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
          <div className='relative z-20 w-80 md:w-96 h-full bg-[var(--background)]/80 backdrop-blur-md flex flex-col transition-transform duration-300'>
            {/* Close button */}
            <button
              className='absolute top-2 left-2 text-white text-2xl z-30 cursor-pointer'
              onClick={toggleMap}
              aria-label='Close map'>
              ✕
            </button>
            <MapComponent
              eventId={id}
              address={displayedAddress}
            />
          </div>
        </div>
      )}
    </div>
  );
}
