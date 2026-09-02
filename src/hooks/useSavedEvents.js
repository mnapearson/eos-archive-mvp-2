'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// userId now comes from AuthContext instead of this hook's own
// getSession()/onAuthStateChange pair — see AuthContext.js for why an
// independent auth-state read here was a latent instance of the same
// race that hung /spaces/signup/complete.
export default function useSavedEvents() {
  const supabase = useRef(getSupabaseBrowserClient()).current;
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!userId) { setSavedIds(new Set()); return; }
    supabase
      .from('saved_events')
      .select('event_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map((r) => String(r.event_id))));
      });
  }, [userId, supabase]);

  const toggle = useCallback(async (eventId) => {
    if (!userId) {
      router.push('/login');
      return;
    }
    const key = String(eventId);
    const saving = !savedIds.has(key);
    setSavedIds((prev) => {
      const next = new Set(prev);
      saving ? next.add(key) : next.delete(key);
      return next;
    });
    let error;
    if (saving) {
      ({ error } = await supabase.from('saved_events').insert({ user_id: userId, event_id: Number(eventId) }));
    } else {
      ({ error } = await supabase.from('saved_events').delete().match({ user_id: userId, event_id: Number(eventId) }));
    }
    if (error) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        saving ? next.delete(key) : next.add(key);
        return next;
      });
      toast.error(error?.message ?? 'Could not save event.');
    }
  }, [userId, savedIds, supabase, router]);

  return { userId, savedIds, toggle };
}
