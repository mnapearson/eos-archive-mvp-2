'use client'; // Ensure this page is rendered on the client

import MapComponent from '@/components/MapComponent';

export default function MapPage() {
  return (
    <div className='p-4'>
      <h1 className='text-2xl font-semibold mb-6'>map</h1>
      {/* Render your current MapComponent */}
      <MapComponent />
    </div>
  );
}
