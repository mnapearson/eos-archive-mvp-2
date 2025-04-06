'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';

export default function SpaceListItem({ space, detailed = false }) {
  const router = useRouter();
  const [address, setAddress] = useState('');
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
              const feature = geoData.features[0];
              // Build street address: use "address" (the number) if available and the street name from "text"
              const streetPart = feature.address
                ? `${feature.address} ${feature.text}`
                : feature.text;
              // Find the postal code from context, if available
              const postcodeContext = feature.context?.find((c) =>
                c.id.startsWith('postcode')
              );
              const postcode = postcodeContext ? postcodeContext.text : '';
              // Format: "street address, postcode" (if postcode exists)
              const formatted = postcode
                ? `${streetPart}, ${postcode}`
                : streetPart;
              setAddress(formatted);
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

  const toggleMap = (e) => {
    // Stop propagation so that clicking the map toggle button
    // doesn’t trigger outer navigation.
    e.stopPropagation();
    setMapOpen((prev) => !prev);
  };

  // If not in detailed mode, clicking anywhere on the card (except for the inner links/buttons)
  // should navigate to the space detail page.
  const handleNavigation = () => {
    router.push(`/spaces/${space.id}`);
  };

  // Build the main info content with the new order:
  // Space Name, type, formatted address (clickable for map), city, then website.
  const infoContent = (
    <div className='cursor-pointer'>
      <div className='flex items-center gap-2'>
        <h2 className='text-lg font-semibold'>{space.name}</h2>
        <p className='text-sm italic'>
          ({space.type ? space.type.toLowerCase() : 'default'})
        </p>
      </div>
      {address && (
        <button
          onClick={toggleMap}
          className='block text-sm mt-1 underline'>
          {address}
        </button>
      )}
      <p className='text-sm mb-1'>{space.city}</p>
      {space.website && (
        <p className='mt-1'>
          <a
            href={space.website}
            target='_blank'
            rel='noopener noreferrer'
            className='text-xs uppercase'
            onClick={(e) => e.stopPropagation()}>
            VISIT WEBSITE
          </a>
        </p>
      )}
      {detailed && space.description && (
        <p className='mt-2 text-sm'>{space.description}</p>
      )}
    </div>
  );

  // Wrap in a clickable container if not in detailed mode.
  const mainContent = detailed ? (
    infoContent
  ) : (
    <div onClick={handleNavigation}>{infoContent}</div>
  );

  return (
    <div className='border-b border-gray-200 pb-2 text-left relative flex flex-col-reverse md:flex-row md:justify-between'>
      {/* Left Column: Info */}
      <div className='flex-1'>{mainContent}</div>

      {/* Right Column: Featured image (if available) */}
      {space.image_url && (
        <div className='my-2 md:mt-0 md:ml-4'>
          <img
            src={space.image_url}
            alt={space.name}
            className='max-w-lg object-cover rounded-sm'
          />
        </div>
      )}

      {/* Slide-out Map Panel */}
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
            <button
              className='absolute top-2 left-2 text-white text-2xl z-30 cursor-pointer'
              onClick={toggleMap}
              aria-label='Close map'>
              ✕
            </button>
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
