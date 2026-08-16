'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';

export default function useFollowedSpaces() {
  const supabase = useRef(getSupabaseBrowserClient()).current;
  const [userId, setUserId] = useState(null);
  const [followedIds, setFollowedIds] = useState(new Set());

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
    if (!userId) { setFollowedIds(new Set()); return; }
    supabase
      .from('follows')
      .select('space_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setFollowedIds(new Set(data.map((r) => String(r.space_id))));
      });
  }, [userId, supabase]);

  const toggle = useCallback(async (spaceId) => {
    if (!userId) return;
    const key = String(spaceId);
    const following = !followedIds.has(key);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      following ? next.add(key) : next.delete(key);
      return next;
    });
    if (following) {
      await supabase.from('follows').insert({ user_id: userId, space_id: Number(spaceId) });
    } else {
      await supabase.from('follows').delete().match({ user_id: userId, space_id: Number(spaceId) });
    }
  }, [userId, followedIds, supabase]);

  return { userId, followedIds, toggle };
}
