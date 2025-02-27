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
    // Query events and join with the related spaces record.
    // The syntax 'space:spaces(city, name)' renames the joined record to "space"
    let query = supabase
      .from('events')
      .select('date, category, designer, space:spaces(city, name)');

    // Apply filters – for city and space we filter on nested fields.
    if (selectedFilters.city.length > 0) {
      query = query.in('space.city', selectedFilters.city);
    }
    if (selectedFilters.space.length > 0) {
      query = query.in('space.name', selectedFilters.space);
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

    // Helper to extract unique values from a nested field (for space)
    const uniqueNested = (items, nestedField) =>
      Array.from(
        new Set(items.map((item) => item.space?.[nestedField]).filter(Boolean))
      );
    // Helper for flat fields from events
    const unique = (items, key) =>
      Array.from(new Set(items.map((item) => item[key]).filter(Boolean)));

    const uniqueCities = uniqueNested(events, 'city');
    const uniqueSpaces = uniqueNested(events, 'name');
    const uniqueCategories = unique(events, 'category');
    const uniqueDesigners = unique(events, 'designer');
    const uniqueDates = unique(events, 'date');

    // Sort alphabetically (ascending) for text options
    const sortAlpha = (arr) => [...arr].sort((a, b) => a.localeCompare(b));
    setCityOptions(sortAlpha(uniqueCities));
    setSpaceOptions(sortAlpha(uniqueSpaces));
    setCategoryOptions(sortAlpha(uniqueCategories));
    setDesignerOptions(sortAlpha(uniqueDesigners));

    // For dates, sort descending (most recent first)
    uniqueDates.sort((a, b) => new Date(b) - new Date(a));
    setDateOptions(uniqueDates);
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
