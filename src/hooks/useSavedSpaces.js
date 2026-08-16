'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { useAuth } from '@/contexts/AuthContext';

// Renamed from useFollowedSpaces.js / the `follows` table to saved_spaces —
// matches the "Saved" language already used for events on both platforms
// ("follow" implied ongoing updates that don't otherwise exist here).
// saved_spaces was already mobile's canonical table before this change.
//
// userId comes from AuthContext instead of this hook's own
// getSession()/onAuthStateChange pair — see AuthContext.js for why an
// independent auth-state read here was a latent instance of the same
// race that hung /spaces/signup/complete.
export default function useSavedSpaces() {
  const supabase = useRef(getSupabaseBrowserClient()).current;
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!userId) { setSavedIds(new Set()); return; }
    supabase
      .from('saved_spaces')
      .select('space_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map((r) => String(r.space_id))));
      });
  }, [userId, supabase]);

  const toggle = useCallback(async (spaceId) => {
    if (!userId) return;
    const key = String(spaceId);
    const saving = !savedIds.has(key);
    setSavedIds((prev) => {
      const next = new Set(prev);
      saving ? next.add(key) : next.delete(key);
      return next;
    });
    if (saving) {
      await supabase.from('saved_spaces').insert({ user_id: userId, space_id: Number(spaceId) });
    } else {
      await supabase.from('saved_spaces').delete().match({ user_id: userId, space_id: Number(spaceId) });
    }
  }, [userId, savedIds, supabase]);

  return { userId, savedIds, toggle };
}
