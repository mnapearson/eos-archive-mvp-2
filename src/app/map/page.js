'use client';

import { useEffect, useState } from 'react';
import MapComponent from '@/components/MapComponent';

// Define marker colors for legend display (should match MapComponent)
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
  // Start with no filters selected – meaning show all markers
  const [activeTypes, setActiveTypes] = useState([]);

  useEffect(() => {
    async function fetchSpaces() {
      const response = await fetch('/api/spaces');
      const data = await response.json();
      setSpaces(data);
    }
    fetchSpaces();
  }, []);

  // Compute unique types from spaces (using default for null)
  const uniqueTypes = Array.from(
    new Set(
      spaces.map((space) => (space.type ? space.type.toLowerCase() : 'default'))
    )
  );

  // Toggle activeTypes:
  // If activeTypes is empty, clicking a button sets it to [clickedType].
  // Otherwise, toggle the clicked type in the activeTypes array.
  const toggleType = (type) => {
    setActiveTypes((prev) => {
      if (prev.length === 0) {
        return [type];
      } else if (prev.includes(type)) {
        const updated = prev.filter((t) => t !== type);
        return updated; // If empty, it means show all markers.
      } else {
        return [...prev, type];
      }
    });
  };

  return (
    <div className='max-w-3xl mx-auto'>
      <h1 className='font-semibold mb-6'>spaces in the archive</h1>

      {/* Legend placed outside the map */}
      <div className='mb-4 flex flex-wrap gap-2'>
        {uniqueTypes.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded 
              ${
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
      <MapComponent
        spaces={spaces}
        activeTypes={activeTypes}
      />
    </div>
  );
}
