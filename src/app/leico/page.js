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

  // Filter spaces by search query (name or city, case-insensitive, trimmed)
  const q = searchQuery.trim().toLowerCase();
  const filteredSpaces = q
    ? spaces.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q)
      )
    : spaces;

  const noResults = q.length > 0 && filteredSpaces.length === 0;

  return (
    <main className='px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto '>
        <h1 className='text-[11px] tracking-wide uppercase opacity-60'>
          LEICO × eos archive
        </h1>
        <p className='mt-2 max-w-2xl text-sm italic opacity-80'>
          This page documents the collaboration between LEICO and eos archive —
          an online extension of the printed LEICO map, a selection of Leipzig’s
          contemporary art spaces.
        </p>

        {/* Toggle and Search */}
        <div className='my-4 flex items-center gap-4'>
          <input
            type='text'
            placeholder='Search by space name or city'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='input flex-grow'
          />

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
          <div className='relative h-screen'>
            {noResults && (
              <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center'>
                <div className='rounded-md border border-white/20 bg-[var(--background)]/80 px-3 py-2 text-sm italic'>
                  No spaces match your search.
                </div>
              </div>
            )}
            {!noResults && (
              <MapComponent
                key={`leico-${q}-${filteredSpaces.length}`}
                spaces={filteredSpaces}
                initialCenter={{ lat: 51.3397, lng: 12.3731 }}
                initialZoom={11}
                activeTypes={[]}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
