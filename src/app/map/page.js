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
  // Start with no filters selected – meaning show all markers for those spaces
  const [activeTypes, setActiveTypes] = useState([]);

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

  // 5. Compute unique marker types from the returned spaces
  const uniqueTypes = Array.from(
    new Set(
      spaces.map((space) => (space.type ? space.type.toLowerCase() : 'default'))
    )
  );

  // 6. Toggle the activeTypes array
  // If empty, clicking sets it to [type]. Otherwise, toggle the clicked type
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

  return (
    <div className='max-w-3xl mx-auto h-screen'>
      {' '}
      {/* set desired height */}
      {/* Legend for marker types */}
      <div className='mb-4 flex flex-wrap gap-2'>
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
      </div>
      <div className='h-full'>
        <MapComponent
          spaces={spaces}
          activeTypes={activeTypes}
        />
      </div>
    </div>
  );
}
