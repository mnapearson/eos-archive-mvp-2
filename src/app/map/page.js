'use client'; // Ensure this page is rendered on the client

import MapComponent from '@/components/MapComponent';

export default function MapPage() {
  return (
    <div className='p-4'>
      <h1 className='text-3xl font-bold mb-4'>Map</h1>
      {/* Render your current MapComponent */}
      <MapComponent />
    </div>
  );
}
