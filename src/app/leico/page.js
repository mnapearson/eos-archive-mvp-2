'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import SpaceListItem from '@/components/SpaceListItem';
import MapComponent from '@/components/MapComponent';
import markerColors from '@/lib/markerColors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LeicoPage() {
  const [spaces, setSpaces] = useState([]);
  // Toggle between list and map view
  const [isListView, setIsListView] = useState(true);
  // Search query for filtering list view
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchLeicoSpaces() {
      const { data, error } = await supabase
        .from('spaces')
        .select(
          'id, name, type, latitude, longitude, city, website, description, image_url'
        )
        .eq('leico', true);
      if (error) {
        console.error('Error fetching LEICO spaces:', error);
      } else {
        setSpaces(data);
      }
    }
    fetchLeicoSpaces();
  }, []);

  // Filter spaces by search query
  const filteredSpaces = spaces.filter((space) =>
    space.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='mx-auto '>
      <h1 className='text-lg font-semibold mb-4'>LEICO × eos archive</h1>
      <p className='mb-6 italic text-sm'>
        This page documents the collaboration between LEICO and eos archive — an
        online extension of the printed LEICO map, a selection of Leipzig’s
        contemporary art spaces.
      </p>

      {/* Toggle and Search */}
      <div className='mb-4 flex items-center gap-4'>
        {isListView && (
          <input
            type='text'
            placeholder='Search list by space name'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='input flex-grow'
          />
        )}
        <button
          onClick={() => setIsListView(!isListView)}
          className='button whitespace-nowrap'>
          {isListView ? 'Show Map' : 'Show List'}
        </button>
      </div>

      {/* Main content */}
      {isListView ? (
        filteredSpaces.length === 0 ? (
          <p className='italic'>No spaces match your search.</p>
        ) : (
          <div className='space-y-6'>
            {filteredSpaces.map((space) => (
              <SpaceListItem
                key={space.id}
                space={space}
              />
            ))}
          </div>
        )
      ) : (
        <div className='h-screen'>
          <MapComponent
            spaces={spaces}
            initialCenter={{ lat: 51.3397, lng: 12.3731 }}
            initialZoom={11}
            activeTypes={[]}
          />
        </div>
      )}
    </div>
  );
}
