'use client';

import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { CITY_COORDINATES } from '@/lib/cityCoordinates';

// Ported from eos-archive-app/lib/useCities.ts.
export default function useCities() {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    let alive = true;
    supabase
      .from('spaces')
      .select('city_name, city')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!alive) return;
        const cityNames = [
          ...new Set(
            (data ?? [])
              .map((s) => s.city_name ?? s.city)
              .filter((c) => !!c)
          ),
        ];

        const known = cityNames
          .filter((name) => CITY_COORDINATES[name])
          .map((name) => ({ name, ...CITY_COORDINATES[name] }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const missing = cityNames.filter((name) => !CITY_COORDINATES[name]);
        if (missing.length) console.warn('City missing coordinates:', missing);

        setCities(known);
      });
    return () => {
      alive = false;
    };
  }, []);

  return cities;
}
