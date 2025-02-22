// src/contexts/FilterContext.js
'use client';

import { createContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const FilterContext = createContext();

export function FilterProvider({ children }) {
  // Example of multi-select approach
  const [selectedFilters, setSelectedFilters] = useState({
    city: [],
    space: [],
    date: [],
    category: [],
    designer: [],
  });

  const [cityOptions, setCityOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);

  // Re-fetch available options whenever selectedFilters changes
  useEffect(() => {
    fetchAvailableOptions();
  }, [selectedFilters]);

  async function fetchAvailableOptions() {
    // Build a Supabase query that filters by the user's current selections
    let query = supabase
      .from('events')
      .select('city, space, date, category, designer');

    // If the user has selected multiple cities, we can use the "in" operator
    if (selectedFilters.city.length > 0) {
      query = query.in('city', selectedFilters.city);
    }
    if (selectedFilters.space.length > 0) {
      query = query.in('space', selectedFilters.space);
    }
    if (selectedFilters.date.length > 0) {
      query = query.in('date', selectedFilters.date);
    }
    if (selectedFilters.category.length > 0) {
      query = query.in('category', selectedFilters.category);
    }
    if (selectedFilters.designer.length > 0) {
      query = query.in('designer', selectedFilters.designer);
    }

    const { data: events, error } = await query;
    if (error) {
      console.error('Error fetching filtered events:', error);
      return;
    }

    // Extract unique options from matching events
    const unique = (items, key) =>
      Array.from(new Set(items.map((item) => item[key]).filter(Boolean)));

    setCityOptions(unique(events, 'city'));
    setSpaceOptions(unique(events, 'space'));
    setDateOptions(unique(events, 'date'));
    setCategoryOptions(unique(events, 'category'));
    setDesignerOptions(unique(events, 'designer'));
  }

  return (
    <FilterContext.Provider
      value={{
        selectedFilters,
        setSelectedFilters,
        cityOptions,
        spaceOptions,
        dateOptions,
        categoryOptions,
        designerOptions,
      }}>
      {children}
    </FilterContext.Provider>
  );
}
