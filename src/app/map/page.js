'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapComponent from '@/components/MapComponent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const markerColors = {
  'off-space': '#FF6EC7',
  bar: '#1F51FF',
  club: '#9D00FF',
  gallery: '#FFFF00',
  studio: '#39FF14',
  kino: '#FF073A',
  default: '#F8F8F8',
};

export default function SpacesPage() {
  const [spaces, setSpaces] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  // Toggle between list and map view
  const [isListView, setIsListView] = useState(false);
  // Search query for filtering (only used in list view)
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchSpacesForApprovedEvents() {
      try {
        // 1. Query the events table for approved events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('space_id')
          .eq('approved', true);
        if (eventsError) {
          console.error('Error fetching approved events:', eventsError);
          return;
        }
        // 2. Extract unique space IDs from these approved events
        const approvedSpaceIds = Array.from(
          new Set(eventsData.map((e) => e.space_id).filter(Boolean))
        );
        if (approvedSpaceIds.length === 0) {
          setSpaces([]);
          return;
        }
        // 3. Query the spaces table for these space IDs (including website)
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select('id, name, type, latitude, longitude, city, website')
          .in('id', approvedSpaceIds);
        if (spacesError) {
          console.error('Error fetching spaces:', spacesError);
          return;
        }
        setSpaces(spacesData);
      } catch (err) {
        console.error(
          'Unexpected error fetching spaces for approved events:',
          err
        );
      }
    }
    fetchSpacesForApprovedEvents();
  }, []);

  // Compute unique marker types.
  const uniqueTypes = Array.from(
    new Set(
      spaces.map((space) => (space.type ? space.type.toLowerCase() : 'default'))
    )
  );

  // Toggle activeTypes.
  const toggleType = (type) => {
    setActiveTypes((prev) => {
      if (prev.length === 0) return [type];
      else if (prev.includes(type)) return prev.filter((t) => t !== type);
      else return [...prev, type];
    });
  };

  // Filter spaces by activeTypes.
  const filteredByType =
    activeTypes.length > 0
      ? spaces.filter((space) => {
          const typeKey = space.type ? space.type.toLowerCase() : 'default';
          return activeTypes.includes(typeKey);
        })
      : spaces;

  // Apply search filter (only in list view).
  const finalFilteredSpaces = isListView
    ? filteredByType.filter((space) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return (
          (space.name && space.name.toLowerCase().includes(query)) ||
          (space.city && space.city.toLowerCase().includes(query)) ||
          (space.website && space.website.toLowerCase().includes(query))
        );
      })
    : filteredByType;

  return (
    <div className='max-w-3xl mx-auto h-screen flex flex-col'>
      {/* Top row: Legend and Toggle button */}
      <div className='mb-2 flex flex-wrap items-center gap-2'>
        {uniqueTypes.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
              activeTypes.length === 0 || activeTypes.includes(type)
                ? 'border border-[var(--foreground)]'
                : 'opacity-50'
            }`}>
            <span
              className='w-3 h-3 rounded-full border border-[var(--foreground)]'
              style={{
                backgroundColor: markerColors[type] || markerColors.default,
              }}></span>
            <span>{type.toUpperCase()}</span>
          </button>
        ))}
        <button
          onClick={() => setIsListView(!isListView)}
          className='ml-auto px-3 py-1 border border-[var(--foreground)] rounded text-xs'>
          {isListView ? 'SHOW MAP' : 'SHOW LIST'}
        </button>
      </div>
      {/* Render search field only in list view (in its own row) */}
      {isListView && (
        <div className='mb-2'>
          <input
            type='text'
            placeholder='Search by name, city, or website'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full my-3 p-2 border border-[var(--foreground)] rounded text-xs'
          />
        </div>
      )}
      {/* Main content: List or Map view */}
      <div className='flex-grow'>
        {isListView ? (
          <SpacesList spaces={finalFilteredSpaces} />
        ) : (
          <MapComponent
            spaces={spaces}
            activeTypes={activeTypes}
          />
        )}
      </div>
    </div>
  );
}

function SpacesList({ spaces }) {
  if (spaces.length === 0) {
    return <p className='text-sm italic'>No spaces found.</p>;
  }
  return (
    <div className='space-y-4 overflow-auto h-full pr-2'>
      {spaces.map((space) => (
        <SpaceListItem
          key={space.id}
          space={space}
        />
      ))}
    </div>
  );
}

function SpaceListItem({ space }) {
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

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
        alert('Address copied to clipboard.');
      });
    }
  };

  return (
    <div className='border-b border-gray-300 pb-2'>
      <h2 className='text-sm font-semibold'>{space.name}</h2>
      <p className='text-xs'>{space.city}</p>
      {address && (
        <button
          onClick={handleCopy}
          className='block text-xs underline uppercase mt-1'>
          {address}
        </button>
      )}
      <p className='text-xs italic'>
        {space.type ? space.type.toLowerCase() : 'default'}
      </p>
      {space.website && (
        <p className='mt-1'>
          <a
            href={space.website}
            target='_blank'
            rel='noopener noreferrer'
            className='text-xs underline uppercase'>
            VISIT WEBSITE
          </a>
        </p>
      )}
    </div>
  );
}
