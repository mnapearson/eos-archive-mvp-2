'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MapComponent from '@/components/MapComponent';
import Link from 'next/link';

// Format the date/time: "JUNE 1, 2024 @ 19.00"
function formatDateTime(dateString, timeString) {
  if (!dateString) return '';
  const dateObj = new Date(dateString);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);

  let timePart = '';
  if (timeString) {
    // Split the time string and take only hours and minutes
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
  const [address, setAddress] = useState(''); // Reverse-geocoded address

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      const response = await fetch(`/api/events/${id}`);
      const data = await response.json();
      setEvent(data);

      // If lat/long are present, reverse-geocode them
      if (data.latitude && data.longitude) {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!mapboxToken) {
          console.warn('No Mapbox token found in NEXT_PUBLIC_MAPBOX_TOKEN');
          return;
        }
        const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${data.longitude},${data.latitude}.json?access_token=${mapboxToken}`;
        try {
          const geoRes = await fetch(geoUrl);
          const geoData = await geoRes.json();
          if (geoData.features && geoData.features.length > 0) {
            setAddress(geoData.features[0].place_name);
          } else {
            setAddress('UNKNOWN ADDRESS');
          }
        } catch (error) {
          console.error('Error reverse-geocoding:', error);
          setAddress('UNKNOWN ADDRESS');
        }
      } else {
        // If no lat/long, fallback
        setAddress(data.city || 'UNKNOWN ADDRESS');
      }
    }
    fetchEvent();
  }, [id]);

  // If still loading
  if (!event) {
    return <p className='p-4'>Loading event details...</p>;
  }

  // Title in uppercase
  const eventTitle = (event.title || 'UNTITLED').toUpperCase();
  // Category: match your Figma (if you want uppercase or normal case)
  const eventCategory = event.category || '';
  // Format date/time as "JUNE 1, 2024 @ 19.00"
  const dateTimeDisplay = formatDateTime(event.date, event.time);
  // Fallback description
  const eventDescription =
    event.description ||
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tincidunt vehicula turpis.';

  // SHARE handler
  const handleShare = async (e) => {
    e.preventDefault(); // So clicking doesn't navigate if using <Link>
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: 'Check out this event!',
          url: window.location.href,
        });
      } catch (error) {
        // If user cancels, do nothing
      }
    } else {
      alert('Sharing not supported in this browser.');
    }
  };

  return (
    <div className='max-w-screen-lg mx-auto px-4 py-8'>
      {/* Return Link */}
      <div className='mb-4'>
        <Link
          href='/'
          className='underline text-sm hover:text-gray-600'>
          return to archive
        </Link>
      </div>
      {/* Two-column layout */}
      <div className='flex flex-col md:flex-row gap-8 mb-8'>
        {/* Left Column: Flyer */}
        <div className='md:w-1/2'>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={`Flyer for ${event.title}`}
              className='w-full h-auto rounded-lg shadow'
            />
          ) : (
            <p className='text-gray-500'>No flyer available</p>
          )}
        </div>

        {/* Right Column: Info */}
        <div className='md:w-1/2 flex flex-col justify-between'>
          <div>
            {/* Title + SHARE in same line, top-right for SHARE */}
            <div className='flex items-center justify-between mb-1'>
              <h1 className='text-l font-bold'>{eventTitle}</h1>
              <Link
                href='#'
                onClick={handleShare}
                className='text-sm'>
                SHARE
              </Link>
            </div>
            {/* Category */}
            <p className='text-sm italic mb-4'>{eventCategory}</p>

            {/* Date & Time: "JUNE 1, 2024 @ 19.00" */}
            {dateTimeDisplay && (
              <p className='text-sm mb-4'>{dateTimeDisplay}</p>
            )}

            {/* Reverse-geocoded address (no "LOCATION" label) */}
            {address && <p className='text-sm mb-4'>{address}</p>}

            {/* Description */}
            <p className='text-sm whitespace-pre-line'>{eventDescription}</p>
          </div>
        </div>
      </div>
      <MapComponent eventId={id} />
    </div>
  );
}
