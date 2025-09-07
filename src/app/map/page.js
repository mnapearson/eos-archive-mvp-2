'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapComponent from '@/components/MapComponent';
import SpaceListItem from '@/components/SpaceListItem';
import markerColors from '@/lib/markerColors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SpacesPage() {
  const [spaces, setSpaces] = useState([]);
  const [activeTypes, setActiveTypes] = useState([]);
  // Toggle between list and map view
  const [isListView, setIsListView] = useState(true);
  // Search query for filtering (used in both views now)
  const [searchQuery, setSearchQuery] = useState('');

  // Legend open/closed (mobile defaults to closed)
  const [legendOpen, setLegendOpen] = useState(true);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const small = window.matchMedia('(max-width: 640px)').matches;
      setLegendOpen(!small); // open on desktop, closed on mobile
    }
  }, []);

  useEffect(() => {
    async function fetchAllSpaces() {
      try {
        const { data: spacesData, error } = await supabase
          .from('spaces')
          .select(
            'id, name, type, latitude, longitude, city, website, description, image_url'
          );
        if (error) {
          console.error('Error fetching spaces:', error);
          return;
        }
        setSpaces(spacesData);
      } catch (err) {
        console.error('Unexpected error fetching spaces:', err);
      }
    }
    fetchAllSpaces();
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

  // Apply search filter for BOTH views (list & map)
  const finalFilteredSpaces = filteredByType.filter((space) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (space.name && space.name.toLowerCase().includes(query)) ||
      (space.city && space.city.toLowerCase().includes(query)) ||
      (space.website && space.website.toLowerCase().includes(query))
    );
  });

  // Sort the final spaces list alphabetically by the space name.
  const sortedSpaces = [...finalFilteredSpaces].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <main className='px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto h-screen min-h-0 flex flex-col'>
        <header className='mb-3 sm:mb-4'>
          <h1 className='text-[11px] tracking-wide uppercase opacity-60'>
            Spaces ARCHIVE
          </h1>
          <p className='mt-2 max-w-2xl text-sm italic opacity-80'>
            Browse the growing number of selected spaces included in the
            archive. Use search to filter by name or city, toggle the legend to
            filter by type, and switch between map and list views.
          </p>
        </header>
        <div className='mb-2 flex items-center gap-2'>
          <input
            type='text'
            placeholder='Search by space name or city'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='input flex-grow'
          />

          <button
            onClick={() => setIsListView(!isListView)}
            className='button whitespace-nowrap ml-auto'>
            {isListView ? 'SHOW MAP' : 'SHOW LIST'}
          </button>
        </div>
        {/* Main content: List or Map view */}
        <div
          className={`flex-1 pb-20 relative min-h-0 ${
            isListView ? 'overflow-auto' : 'overflow-hidden'
          }`}>
          {isListView ? (
            <SpacesList spaces={sortedSpaces} />
          ) : (
            <>
              <MapComponent
                spaces={sortedSpaces}
                initialCenter={{ lat: 51.3397, lng: 12.3731 }}
                initialZoom={11}
                activeTypes={activeTypes}
              />
              {/* Map legend (top-left) with mobile-friendly pill toggle */}
              <div className='absolute top-2 left-2 z-10'>
                <button
                  onClick={() => setLegendOpen((o) => !o)}
                  className='button'
                  aria-expanded={legendOpen}
                  aria-controls='map-legend-panel'>
                  {legendOpen ? 'Legend ▾' : 'Legend ▸'}
                </button>

                {legendOpen && (
                  <div
                    id='map-legend-panel'
                    className='mt-2 bg-[var(--background)]/80 backdrop-blur-md border rounded px-2 py-2 shadow-md w-[min(90vw,320px)] sm:w-auto'>
                    <div className='flex flex-col gap-2 max-h-[40vh] overflow-auto sm:max-h-none sm:flex-row sm:flex-wrap'>
                      {uniqueTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`flex items-center gap-2 px-2 py-1 text-xs rounded w-full sm:w-auto ${
                            activeTypes.length === 0 ||
                            activeTypes.includes(type)
                              ? 'border border-[var(--foreground)]'
                              : 'opacity-50'
                          }`}>
                          <span
                            className='w-3 h-3 rounded-full border border-[var(--foreground)] flex-shrink-0'
                            style={{
                              backgroundColor:
                                markerColors[type] || markerColors.default,
                            }}
                          />
                          <span className='truncate'>{type.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function SpacesList({ spaces }) {
  if (spaces.length === 0) {
    return <p className='text-sm italic'>No spaces found.</p>;
  }
  return (
    <>
      <div className='space-y-4'>
        {spaces.map((space) => (
          <SpaceListItem
            key={space.id}
            space={space}
          />
        ))}
      </div>
      <p className='text-sm italic mt-4'>No more spaces found.</p>
    </>
  );
}
