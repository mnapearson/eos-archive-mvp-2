'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MapComponent from '@/components/MapComponent';

export default function SpaceListItem({ space }) {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
              const streetPart = feature.address
                ? `${feature.address} ${feature.text}`
                : feature.text;
              const postcodeContext = feature.context?.find((c) =>
                c.id.startsWith('postcode')
              );
              const postcode = postcodeContext ? postcodeContext.text : '';
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
    e.stopPropagation();
    setMapOpen((prev) => !prev);
  };

  const handleNavigation = () => {
    router.push(`/spaces/${space.id}`);
  };

  // Helper function to truncate text
  const truncateText = (text, limit = 150) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) : text;
  };

  // Render description with read more / read less toggling
  const renderDescription = () => {
    if (!space.description) return null;
    const limit = 400;
    if (space.description.length <= limit) {
      return <p className='mt-2 text-sm'>{space.description}</p>;
    }
    if (isExpanded) {
      return (
        <div className='mt-2 text-sm text-[var(--foreground)]'>
          <p>{space.description}</p>
          <button
            className='mt-2 text-sm text-[var(--foreground)]'
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}>
            Read less
          </button>
        </div>
      );
    } else {
      return (
        <div className='mt-2 text-sm text-[var(--foreground)] '>
          <p>{truncateText(space.description, limit)}(...)</p>
          <button
            className='mt-2 text-sm text-[var(--foreground)]'
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}>
            Read more
          </button>
        </div>
      );
    }
  };

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
      {renderDescription()}
    </div>
  );

  // Wrap the infoContent so clicking anywhere navigates to the space page.
  const mainContent = <div onClick={handleNavigation}>{infoContent}</div>;

  return (
    <div className='border-b border-[var(--foreground)] pb-2 text-left relative flex flex-col-reverse md:flex-row md:justify-between md:items-stretch'>
      <div className='flex-1'>{mainContent}</div>
      {space.image_url && (
        <div className='my-2 md:mt-0 md:ml-4'>
          <img
            src={space.image_url}
            alt={space.name}
            className='h-auto w-[300px] object-cover rounded-sm'
          />
        </div>
      )}
      {mapOpen && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          <div
            className='absolute inset-0 bg-[var(--background)]/80 backdrop-blur-md'
            onClick={toggleMap}
            aria-hidden='true'
          />
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
