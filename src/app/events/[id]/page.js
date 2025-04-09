'use client';

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import MapComponent from '@/components/MapComponent';
import { FilterContext } from '@/contexts/FilterContext';

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
  const router = useRouter();
  const { setSelectedFilters } = useContext(FilterContext);

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
  const eventDescription = event.description || 'No description provided.';
  const displayedAddress =
    event.space?.address ||
    spaceAddress ||
    event.space?.city ||
    'UNKNOWN ADDRESS';

  // Functions to update the global filters and route to the homepage.
  const handleCityClick = (city) => {
    setSelectedFilters((prev) => ({ ...prev, city: [city] }));
    router.push('/');
  };

  const handleCategoryClick = (category) => {
    setSelectedFilters((prev) => ({ ...prev, category: [category] }));
    router.push('/');
  };

  // New function: clicking on the designer filters for that designer.
  const handleDesignerClick = (designer) => {
    setSelectedFilters((prev) => ({ ...prev, designer: [designer] }));
    router.push('/');
  };

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
        // User cancelled sharing.
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
            <p className='italic text-gray-600'>No flyer available.</p>
          )}
        </div>
        {/* Right Column: Event Info */}
        <div className='md:w-1/4 flex flex-col justify-between'>
          <div>
            <div className='mb-1'>
              {/* Render clickable city and category buttons */}
              {event.space && event.space.city && (
                <div className='flex flex-row mb-4 gap-2'>
                  <button
                    onClick={() => handleCityClick(event.space.city)}
                    className='button'>
                    {event.space.city}
                  </button>
                  {eventCategory && (
                    <button
                      onClick={() => handleCategoryClick(eventCategory)}
                      className='button'>
                      {eventCategory}
                    </button>
                  )}{' '}
                  <button
                    onClick={() => handleDesignerClick(eventDesigner)}
                    className='button'>
                    {eventDesigner}
                  </button>
                </div>
              )}
              <Link href={`/spaces/${event.space.id}`}>
                <p className='text-lg font-bold cursor-pointer hover:underline'>
                  {event.space?.name || 'UNKNOWN SPACE'}
                </p>
              </Link>
              <h1 className='text-sm font-bold'>{eventTitle}</h1>
            </div>
            {dateTimeDisplay && (
              <p className='text-sm mb-2'>{dateTimeDisplay}</p>
            )}
            <p className='text-sm whitespace-pre-line mb-6'>
              {eventDescription}
            </p>
            <Link
              href='#'
              onClick={handleShare}
              className='button'>
              SHARE
            </Link>
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
