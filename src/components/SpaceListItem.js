'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';

export default function SpaceListItem({ space, detailed = false }) {
  const [address, setAddress] = useState('');
  // Local state to control whether the map panel is open
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (space.latitude && space.longitude) {
      const lng = Number(space.longitude);
      const lat = Number(space.latitude);
      if (!isNaN(lng) && !isNaN(lat)) {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
        )
          .then((res) => res.json())
          .then((geoData) => {
            if (geoData.features && geoData.features.length > 0) {
              setAddress(geoData.features[0].place_name);
            } else {
              setAddress('UNKNOWN ADDRESS');
            }
          })
          .catch((err) => {
            console.error('Reverse geocoding error:', err);
            setAddress('UNKNOWN ADDRESS');
          });
      }
    }
  }, [space.latitude, space.longitude]);

  // Toggle the map panel open/closed
  const toggleMap = (e) => {
    // Stop any parent link navigation from happening
    e.stopPropagation();
    setMapOpen((prev) => !prev);
  };

  // The portion that navigates to the space detail page
  const mainContent = (
    <div className='cursor-pointer'>
      <h2 className='text-sm font-semibold'>{space.name}</h2>
      <p className='text-xs italic'>
        {space.type ? space.type.toLowerCase() : 'default'}
      </p>
      <p className='text-xs mb-1 text-left'>{space.city}</p>
      {address && (
        <button
          onClick={toggleMap}
          className='block text-xs mt-1 text-left'>
          {address}
        </button>
      )}
    </div>
  );

  return (
    <div className='border-b border-gray-200 pb-2 text-left relative'>
      {/* 
        If we're not in 'detailed' mode, wrap the main content in a Link
        that navigates to /spaces/[id]. If in detailed mode, we skip the link 
        so we can show extended info in place. 
      */}
      {detailed ? (
        mainContent
      ) : (
        <Link
          href={`/spaces/${space.id}`}
          passHref>
          {mainContent}
        </Link>
      )}

      {/* If a website is available, render it outside the main clickable block */}
      {space.website && (
        <p className='mt-1'>
          <a
            href={space.website}
            target='_blank'
            rel='noopener noreferrer'
            className='text-xs uppercase'>
            VISIT WEBSITE
          </a>
        </p>
      )}

      {/* If in detailed mode, optionally show featured image / description */}
      {detailed && space.featured_image && (
        <div className='mt-2'>
          <img
            src={space.featured_image}
            alt={space.name}
            className='w-full h-auto rounded'
          />
        </div>
      )}
      {detailed && space.description && (
        <p className='mt-2 text-sm'>{space.description}</p>
      )}

      {/* Slide-out Map Panel (similar to your event page) */}
      {mapOpen && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          {/* Semi-transparent overlay */}
          <div
            className='absolute inset-0 bg-[var(--background)]/80 backdrop-blur-md'
            onClick={toggleMap}
            aria-hidden='true'
          />
          {/* Slide-out panel */}
          <div className='relative z-20 w-80 md:w-96 h-full bg-[var(--background)]/80 backdrop-blur-md flex flex-col transition-transform duration-300'>
            {/* Close button */}
            <button
              className='absolute top-2 left-2 text-white text-2xl z-30 cursor-pointer'
              onClick={toggleMap}
              aria-label='Close map'>
              ✕
            </button>
            {/* 
              Use the MapComponent with the single space 
              so it centers on this space's lat/long
            */}
            <MapComponent
              spaces={[space]}
              address={address}
              initialZoom={14}
            />
          </div>
        </div>
      )}
    </div>
  );
}
