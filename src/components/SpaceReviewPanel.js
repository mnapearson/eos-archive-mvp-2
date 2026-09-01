'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function SpaceReviewPanel() {
  const supabase = getSupabaseBrowserClient();
  // Only ever rendered inside /admin/page.js, which already guarantees a
  // valid admin session before mounting this — session comes from
  // AuthContext instead of a fresh getSession() call here. See
  // AuthContext.js for why an independent auth-state read was a latent
  // instance of the same race that hung /spaces/signup/complete.
  const { session } = useAuth();
  const [pendingSpaces, setPendingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSpaces();
  }, []);

  async function fetchPendingSpaces() {
    setLoading(true);
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('status', 'pending');
    if (error) {
      console.error('Error fetching pending spaces:', error);
      toast.error('Unable to load pending spaces.');
    } else {
      setPendingSpaces(data || []);
    }
    setLoading(false);
  }

  async function updateSpaceStatus(spaceId, newStatus) {
    if (!session) {
      toast.error('Your session has expired — please log in again.');
      return;
    }

    const res = await fetch(`/api/spaces/${spaceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      console.error(`Error updating space ${spaceId} status:`, error);
      toast.error(error || 'Unable to update this space right now.');
    } else {
      setPendingSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      toast.success(`Space ${newStatus}.`);
    }
  }

  return (
    <section className='space-y-4'>
      {loading ? (
        <p className='text-sm text-[var(--foreground)]/60'>Loading pending spaces…</p>
      ) : pendingSpaces.length === 0 ? (
        <p className='text-sm text-[var(--foreground)]/60'>No pending registrations.</p>
      ) : (
        <ul className='space-y-3'>
          {pendingSpaces.map((space) => {
            const imageUrl = space.image_url || space.hero_image_url;
            return (
              <li
                key={space.id}
                className='flex gap-4 rounded-2xl border border-[var(--foreground)]/14 bg-[var(--background)]/80 p-4'>
                <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--foreground)]/5'>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={space.name || 'Space image'}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-center text-[9px] uppercase tracking-[0.04em] text-[var(--foreground)]/40'>
                      No image
                    </div>
                  )}
                </div>

                <div className='min-w-0 flex-1'>
                  <h3 className='text-base font-semibold text-[var(--foreground)]'>
                    {space.name}
                  </h3>
                  {space.description && (
                    <p className='mt-1 text-sm text-[var(--foreground)]/70'>
                      {space.description}
                    </p>
                  )}
                  <p className='mt-1 text-xs text-[var(--foreground)]/50'>
                    {[space.address, space.city_name ?? space.city]
                      .filter(Boolean)
                      .join(', ')}
                    {space.type ? ` · ${space.type}` : ''}
                  </p>
                  <div className='mt-3 flex gap-2'>
                    <button
                      type='button'
                      onClick={() => updateSpaceStatus(space.id, 'approved')}
                      className='nav-action nav-cta !inline-flex px-4 '>
                      Approve
                    </button>
                    <button
                      type='button'
                      onClick={() => updateSpaceStatus(space.id, 'rejected')}
                      className='nav-action !inline-flex px-4 text-[var(--danger)]'>
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
