'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function useUserProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const supabase = createClientComponentClient();

    async function load(session) {
      const authUser = session?.user || null;
      setUser(authUser);
      if (authUser) {
        const { data } = await supabase
          .from('profiles')
          .select('role, display_name, bio, location')
          .eq('id', authUser.id)
          .single();
        setProfile(data || null);
      } else {
        setProfile(null);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => load(session));

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => load(session)
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  return { user, profile };
}
