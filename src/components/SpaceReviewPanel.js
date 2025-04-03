'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // make sure you export your supabase client
import Toast from '@/components/Toast'; // your in-app notification component

export default function SpaceReviewPanel() {
  const [pendingSpaces, setPendingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPendingSpaces() {
      setLoading(true);
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('status', 'pending');
      if (error) {
        console.error('Error fetching pending spaces:', error);
      } else {
        setPendingSpaces(data || []);
      }
      setLoading(false);
    }
    fetchPendingSpaces();
  }, []);

  async function updateSpaceStatus(spaceId, newStatus) {
    const { error } = await supabase
      .from('spaces')
      .update({ status: newStatus })
      .eq('id', spaceId);
    if (error) {
      console.error(`Error updating space ${spaceId} status:`, error);
    } else {
      // Remove updated space from the pending list
      setPendingSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      // Show a notification
      Toast.success(`Space ${newStatus}`);
    }
  }

  if (loading) return <p>Loading pending spaces...</p>;

  return (
    <div className='p-4'>
      <h2 className='text-xl font-bold mb-4'>Pending Space Registrations</h2>
      {pendingSpaces.length === 0 ? (
        <p>No pending registrations.</p>
      ) : (
        <ul className='space-y-4'>
          {pendingSpaces.map((space) => (
            <li
              key={space.id}
              className='border p-4 rounded bg-[var(--background)] shadow'>
              <h3 className='text-lg font-semibold'>{space.name}</h3>
              <p>{space.description}</p>
              <p className='text-sm text-gray-500'>{space.address}</p>
              <div className='mt-2 flex gap-2'>
                <button
                  onClick={() => updateSpaceStatus(space.id, 'approved')}
                  className='px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition'>
                  Approve
                </button>
                <button
                  onClick={() => updateSpaceStatus(space.id, 'rejected')}
                  className='px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition'>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
