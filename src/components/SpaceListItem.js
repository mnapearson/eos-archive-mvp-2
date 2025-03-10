// /src/components/SpaceListItem.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SpaceListItem({ space, detailed = false }) {
  const [address, setAddress] = useState('');

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

  const handleCopy = (e) => {
    // Prevent navigation when clicking the copy button
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        alert('Address copied to clipboard.');
      });
    }
  };

  return (
    <div className='border-b border-gray-200 pb-2 text-left'>
      {/* Clickable portion to navigate to space details */}
      <Link
        href={`/spaces/${space.id}`}
        passHref>
        <div className='cursor-pointer'>
          <h2 className='text-sm font-semibold'>{space.name}</h2>
          <p className='text-xs italic mb-1'>
            {space.type ? space.type.toLowerCase() : 'default'}
          </p>
          <p className='text-xs'>{space.city}</p>
          {address && (
            <button
              onClick={handleCopy}
              className='block text-xs underline uppercase mt-1'>
              {address}
            </button>
          )}
        </div>
      </Link>
      {/* Website link rendered separately */}
      {space.website && (
        <p className='mt-2'>
          <a
            href={space.website}
            target='_blank'
            rel='noopener noreferrer'
            className='text-xs uppercase'>
            VISIT WEBSITE
          </a>
        </p>
      )}
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
    </div>
  );
}
