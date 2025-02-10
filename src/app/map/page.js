'use client';

import { useEffect, useState } from 'react';
import MapComponent from '@/components/MapComponent';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    async function fetchSpaces() {
      const response = await fetch('/api/spaces');
      const data = await response.json();
      setSpaces(data);
    }
    fetchSpaces();
  }, []);

  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-6'>spaces in the archive</h1>
      <p className='mb-4'>
        This map shows all spaces that have been featured in eos archive.
      </p>

      {/* Spaces Map */}
      <MapComponent spaces={spaces} />
    </div>
  );
}
