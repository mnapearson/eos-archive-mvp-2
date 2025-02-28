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

  // Options for dropdowns
  const [cityOptions, setCityOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, [selectedFilters]);

  async function fetchOptions() {
    // 1. Fetch city and space options from the spaces table.
    const { data: spacesData, error: spacesError } = await supabase
      .from('spaces')
      .select('city, name');
    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
    }
    const uniqueCities = Array.from(
      new Set(spacesData?.map((item) => item.city).filter(Boolean))
    );
    const uniqueSpaces = Array.from(
      new Set(spacesData?.map((item) => item.name).filter(Boolean))
    );

    // 2. Fetch category, designer, and date options from the events table.
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('category, designer, date');
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }
    const uniqueCategories = Array.from(
      new Set(eventsData?.map((item) => item.category).filter(Boolean))
    );
    const uniqueDesigners = Array.from(
      new Set(eventsData?.map((item) => item.designer).filter(Boolean))
    );
    const uniqueDates = Array.from(
      new Set(eventsData?.map((item) => item.date).filter(Boolean))
    );

    // Sort alphabetically (ascending) for text options.
    const sortAlpha = (arr) => [...arr].sort((a, b) => a.localeCompare(b));
    setCityOptions(sortAlpha(uniqueCities));
    setSpaceOptions(sortAlpha(uniqueSpaces));
    setCategoryOptions(sortAlpha(uniqueCategories));
    setDesignerOptions(sortAlpha(uniqueDesigners));

    // For dates, sort descending (most recent first).
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
