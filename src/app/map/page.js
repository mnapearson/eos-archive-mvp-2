'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapComponent from '@/components/MapComponent';

// Marker colors for the legend (matching your MapComponent logic)
const markerColors = {
  'off-space': '#FF6EC7',
  bar: '#1F51FF',
  club: '#9D00FF',
  gallery: '#FFFF00',
  studio: '#39FF14',
  kino: '#FF073A',
  default: '#F8F8F8',
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SpacesPage() {
  const [spaces, setSpaces] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  // State to toggle between List and Map view
  const [isListView, setIsListView] = useState(false);

  useEffect(() => {
    async function fetchSpacesForApprovedEvents() {
      try {
        // 1. Query the events table for approved events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('space_id')
          .eq('approved', true); // only approved events
        if (eventsError) {
          console.error('Error fetching approved events:', eventsError);
          return;
        }

        // 2. Extract unique space IDs from these approved events
        const approvedSpaceIds = Array.from(
          new Set(eventsData.map((e) => e.space_id).filter(Boolean))
        );

        if (approvedSpaceIds.length === 0) {
          // No approved events => no spaces
          setSpaces([]);
          return;
        }

        // 3. Query the spaces table for these space IDs
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select('id, name, type, latitude, longitude, city')
          .in('id', approvedSpaceIds);

        if (spacesError) {
          console.error('Error fetching spaces:', spacesError);
          return;
        }

        // 4. Update state with the final list of spaces
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

  // Compute unique marker types from the returned spaces
  const uniqueTypes = Array.from(
    new Set(
      spaces.map((space) => (space.type ? space.type.toLowerCase() : 'default'))
    )
  );

  // Toggle the activeTypes array
  const toggleType = (type) => {
    setActiveTypes((prev) => {
      if (prev.length === 0) {
        return [type];
      } else if (prev.includes(type)) {
        const updated = prev.filter((t) => t !== type);
        return updated; // If it becomes empty, show all
      } else {
        return [...prev, type];
      }
    });
  };

  // Filter spaces by activeTypes for the list view
  const filteredSpaces =
    activeTypes.length > 0
      ? spaces.filter((space) => {
          const typeKey = space.type ? space.type.toLowerCase() : 'default';
          return activeTypes.includes(typeKey);
        })
      : spaces;

  return (
    <div className='max-w-3xl mx-auto h-screen flex flex-col'>
      {/* Top row: Legend + Toggle button */}
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        {/* Legend for marker types */}
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
        {/* Toggle between list and map view */}
        <button
          onClick={() => setIsListView(!isListView)}
          className='ml-auto px-3 py-1 border border-[var(--foreground)] rounded text-xs'>
          {isListView ? 'Show Map' : 'Show List'}
        </button>
      </div>

      {/* Main Content: Either list of spaces or the map */}
      <div className='flex-grow'>
        {isListView ? (
          <SpacesList spaces={filteredSpaces} />
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

/**
 * A simple list view for the spaces
 */
function SpacesList({ spaces }) {
  if (spaces.length === 0) {
    return <p className='text-sm italic'>No spaces found.</p>;
  }

  return (
    <div className='space-y-4 overflow-auto h-full pr-2'>
      {spaces.map((space) => (
        <div
          key={space.id}
          className='border-b border-gray-300 pb-2'>
          <h2 className='text-sm font-semibold'>{space.name}</h2>
          <p className='text-xs'>
            {space.city}
            {space.latitude && space.longitude
              ? ` (${space.latitude}, ${space.longitude})`
              : ''}
          </p>
          <p className='text-xs italic'>{space.type || 'Default'}</p>
        </div>
      ))}
    </div>
  );
}
