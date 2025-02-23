// src/contexts/FilterContext.js
'use client';

import { createContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const FilterContext = createContext();

export function FilterProvider({ children }) {
  // Multi-select state for filters
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

  useEffect(() => {
    fetchAvailableOptions();
  }, [selectedFilters]);

  async function fetchAvailableOptions() {
    // Build a query filtering by the user's current selections
    let query = supabase
      .from('events')
      .select('city, space, date, category, designer');

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

    // Helper to extract unique values for a given key
    const unique = (items, key) =>
      Array.from(new Set(items.map((item) => item[key]).filter(Boolean)));

    // Sort alphabetically (ascending)
    const sortAlpha = (arr) => arr.sort((a, b) => a.localeCompare(b));

    setCityOptions(sortAlpha(unique(events, 'city')));
    setSpaceOptions(sortAlpha(unique(events, 'space')));
    setCategoryOptions(sortAlpha(unique(events, 'category')));
    setDesignerOptions(sortAlpha(unique(events, 'designer')));

    // For dates, sort descending (most recent first)
    const dates = unique(events, 'date');
    dates.sort((a, b) => new Date(b) - new Date(a));
    setDateOptions(dates);
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
