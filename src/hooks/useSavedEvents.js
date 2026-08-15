'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

export default function useSavedEvents() {
  const supabase = useRef(createClientComponentClient()).current;
  const [userId, setUserId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

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
    if (!userId) return;
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
  }, [userId, savedIds, supabase]);

  return { userId, savedIds, toggle };
}
