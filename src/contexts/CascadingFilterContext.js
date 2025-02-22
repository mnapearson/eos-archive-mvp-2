'use client';

import { createContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const CascadingFilterContext = createContext();

/**
 * Example structure of the selectedFilters state:
 * {
 *   city: ['Leipzig', 'Berlin'],
 *   space: ['xyz space'],
 *   date: [],
 *   category: ['DJ Night'],
 *   designer: []
 * }
 *
 * The context also stores the dynamically available options for each category
 * (e.g. cityOptions, spaceOptions, etc.) based on the user’s current selection.
 */
export function CascadingFilterProvider({ children }) {
  // The user’s active selections
  const [selectedFilters, setSelectedFilters] = useState({
    city: [],
    space: [],
    date: [],
    category: [],
    designer: [],
  });

  // The dynamically updated options (based on selectedFilters)
  const [cityOptions, setCityOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);

  /**
   * Fetch all possible filter options that match the current selectedFilters.
   * This means we:
   * 1) Build a Supabase query that filters by the user’s current selections
   * 2) From the matching events, extract the distinct city, space, date, category, designer values
   * 3) Update the corresponding state variables (cityOptions, spaceOptions, etc.)
   */
  async function fetchAvailableOptions() {
    // Build a dynamic or() or eq() query based on the user’s selections
    // For multiple selection, we can use the `in` operator in Supabase:
    // e.g. query.in('city', selectedFilters.city) if city is non-empty

    let query = supabase
      .from('events')
      .select('city, space, date, category, designer');

    // City filter
    if (selectedFilters.city.length > 0) {
      query = query.in('city', selectedFilters.city);
    }
    // Space filter
    if (selectedFilters.space.length > 0) {
      query = query.in('space', selectedFilters.space);
    }
    // Category filter
    if (selectedFilters.category.length > 0) {
      query = query.in('category', selectedFilters.category);
    }
    // Designer filter
    if (selectedFilters.designer.length > 0) {
      query = query.in('designer', selectedFilters.designer);
    }
    // Date filter
    // This could be more complex if you store date ranges, etc.
    // For simplicity, assume you can do a direct in() or eq()

    const { data: events, error } = await query;
    if (error) {
      console.error('Error fetching events for filter options:', error);
      return;
    }

    // Now gather the unique values from the matched events
    const unique = (items, key) =>
      Array.from(new Set(items.map((item) => item[key]).filter(Boolean)));

    setCityOptions(unique(events, 'city'));
    setSpaceOptions(unique(events, 'space'));
    setDateOptions(unique(events, 'date'));
    setCategoryOptions(unique(events, 'category'));
    setDesignerOptions(unique(events, 'designer'));
  }

  // Whenever the user’s selectedFilters changes, refetch the available options
  useEffect(() => {
    fetchAvailableOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters]);

  return (
    <CascadingFilterContext.Provider
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
    </CascadingFilterContext.Provider>
  );
}
