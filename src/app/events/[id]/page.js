'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MapComponent from '@/components/MapComponent';
import Link from 'next/link';

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

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      const response = await fetch(`/api/events/${id}`);
      const data = await response.json();
      setEvent(data);
    }
    fetchEvent();
  }, [id]);

  if (!event) {
    return <p className='p-16'>Loading event details...</p>;
  }

  // Use joined space data if available
  // For example, if your API returns the related space data under "space"
  const eventTitle = (event.title || 'UNTITLED').toUpperCase();
  const eventCategory = event.category || '';
  const dateTimeDisplay = formatDateTime(event.date, event.time);
  const eventDescription =
    event.description ||
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tincidunt vehicula turpis.';
  // Use the space's address if available, otherwise fallback to city.
  const fallbackAddress =
    event.space?.name || event.space?.city || 'UNKNOWN ADDRESS';

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
        // If user cancels, do nothing.
      }
    } else {
      alert('Sharing not supported in this browser.');
    }
  };

  return (
    <div className='max-w-screen-lg mx-auto text-[var(--foreground)]'>
      {/* Return Link */}
      <div className='mb-4'>
        <Link
          href='/'
          className='underline text-sm hover:text-gray-600'>
          return to archive
        </Link>
      </div>

      {/* Two-column layout for event details */}
      <div className='flex flex-col md:flex-row gap-8 mb-8'>
        {/* Left Column: Flyer */}
        <div className='md:w-3/4'>
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
        {/* Right Column: Event Info */}
        <div className='md:w-1/4 flex flex-col justify-between'>
          <div>
            <div className='flex items-center justify-between mb-1'>
              <h1 className='font-bold'>{eventTitle}</h1>
              <Link
                href='#'
                onClick={handleShare}
                className='text-sm'>
                SHARE
              </Link>
            </div>
            <p className='text-sm italic mb-2'>{eventCategory}</p>
            {dateTimeDisplay && (
              <p className='text-sm mb-2'>{dateTimeDisplay}</p>
            )}
            {fallbackAddress && (
              <p className='text-sm mb-4'>
                {fallbackAddress}, {event.space.city}
              </p>
            )}

            <p className='text-sm whitespace-pre-line'>{eventDescription}</p>
          </div>
        </div>
      </div>

      {/* Full-width Map below event info.
          Pass fallbackAddress to MapComponent so that its markers can use it if needed.
          Also, if you need the event's space data for the markers (like type, lat, lng),
          ensure your API endpoint returns those fields within the "space" object. */}
      <MapComponent
        eventId={id}
        address={fallbackAddress}
      />
    </div>
  );
}
