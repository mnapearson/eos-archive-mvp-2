'use client';

import { createContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const FilterContext = createContext();

export function FilterProvider({ children }) {
  // These hold the available options for each filter
  const [cityOptions, setCityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);

  // This holds the currently selected filters, e.g. { city: "Leipzig", category: "Art", ... }
  const [filters, setFilters] = useState({
    city: '',
    category: '',
    space: '',
    designer: '',
  });

  useEffect(() => {
    async function fetchOptions() {
      // Replace "events" with your actual Supabase table if needed
      const { data: events, error } = await supabase
        .from('events')
        .select('city, category, space, designer');

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      const unique = (key) => [
        ...new Set(events?.map((item) => item[key]).filter(Boolean)),
      ];

      setCityOptions(unique('city'));
      setCategoryOptions(unique('category'));
      setSpaceOptions(unique('space'));
      setDesignerOptions(unique('designer'));
    }

    fetchOptions();
  }, []);

  return (
    <FilterContext.Provider
      value={{
        cityOptions,
        categoryOptions,
        spaceOptions,
        designerOptions,
        filters,
        setFilters,
      }}>
      {children}
    </FilterContext.Provider>
  );
}
