'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapComponent from '@/components/MapComponent';
import SpaceListItem from '@/components/SpaceListItem';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const markerColors = {
  'off-space': '#FF6EC7', // neon pink
  bar: '#1F51FF', // neon blue
  cafe: '#9D00FF', // neon purple
  gallery: '#FFFF00', // neon yellow
  studio: '#39FF14', // neon green
  kino: '#FF073A', // neon red
  club: '#F8F8F8', // off white for club
  default: '#000000', // default black
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
          .select(
            'id, name, type, latitude, longitude, city, website, description, image_url'
          )
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

  // Sort the final spaces list alphabetically by the space name.
  const sortedSpaces = [...finalFilteredSpaces].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <div className='mx-auto h-screen flex flex-col'>
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
          className='button'>
          {isListView ? 'SHOW MAP' : 'SHOW LIST'}
        </button>
      </div>
      {/* Render search field only in list view (in its own row) */}
      {isListView && (
        <div className='mb-2'>
          <input
            type='text'
            placeholder='Search list by space name or city'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full my-3 p-2 border border-[var(--foreground)] rounded text-xs'
          />
        </div>
      )}
      {/* Main content: List or Map view */}
      <div className='flex-grow'>
        {isListView ? (
          <SpacesList spaces={sortedSpaces} />
        ) : (
          <MapComponent
            spaces={spaces}
            initialCenter={{ lat: 51.3397, lng: 12.3731 }}
            initialZoom={12} // set the default zoom level for spaces here
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
    <div>
      <div className='space-y-4 overflow-auto h-full pr-2'>
        {spaces.map((space) => (
          <SpaceListItem
            key={space.id}
            space={space}
          />
        ))}
      </div>
      <p className='text-sm italic mt-4'>No more spaces found.</p>
      <p className='mt-20 text-lg'>
        Are you part of a subcultural space, and want to become a member of eos
        archive?{' '}
        <a
          href='/spaces/signup'
          className='underline'>
          Register here.
        </a>
      </p>
    </div>
  );
}
