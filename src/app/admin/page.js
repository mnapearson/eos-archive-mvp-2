'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Spinner from '@/components/Spinner';
import RoadmapManager from '@/components/RoadmapManager';
import EventApprovals from '@/components/EventApprovals';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch the user's profile from the "profiles" table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        router.push('/', { scroll: false });
        return;
      }

      setAuthorized(true);
      setLoading(false);
    }

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return <Spinner />;
  }

  if (!authorized) {
    return null;
  }

  return (
    <main>
      <RoadmapManager />
      <EventApprovals />
    </main>
  );
}
