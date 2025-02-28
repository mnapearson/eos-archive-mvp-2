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

  // Options for filter dropdowns
  const [cityOptions, setCityOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);

  useEffect(() => {
    fetchAvailableOptions();
  }, [selectedFilters]);

  async function fetchAvailableOptions() {
    try {
      // 1. Query spaces from the spaces table.
      // If a city filter is selected, get only spaces in that city; otherwise, all spaces.
      let spacesQuery = supabase.from('spaces').select('id, city, name');
      if (selectedFilters.city && selectedFilters.city.length > 0) {
        spacesQuery = spacesQuery.in('city', selectedFilters.city);
      }
      const { data: spacesData, error: spacesError } = await spacesQuery;
      if (spacesError) {
        console.error('Error fetching spaces:', spacesError);
        return;
      }
      // spacesData is an array of spaces that pass the city filter.
      // If a space filter is also selected, filter further by space name.
      let filteredSpaces = spacesData;
      if (selectedFilters.space && selectedFilters.space.length > 0) {
        filteredSpaces = spacesData.filter((s) =>
          selectedFilters.space.includes(s.name)
        );
      }
      // Extract valid space IDs from the filtered spaces.
      const validSpaceIds = filteredSpaces.map((s) => s.id);

      // 2. Build events query.
      let eventsQuery = supabase
        .from('events')
        .select('id, space_id, date, category, designer');

      // Filter events by space_id (if we have any valid ones).
      if (validSpaceIds.length > 0) {
        eventsQuery = eventsQuery.in('space_id', validSpaceIds);
      } else if (
        selectedFilters.city.length > 0 ||
        selectedFilters.space.length > 0
      ) {
        // If filters for city or space are set but yield no valid space IDs, there are no events.
        setCityOptions([]);
        setSpaceOptions([]);
        setCategoryOptions([]);
        setDesignerOptions([]);
        setDateOptions([]);
        return;
      }
      // Apply additional filters for flat fields (date, category, designer)
      ['date', 'category', 'designer'].forEach((key) => {
        if (selectedFilters[key] && selectedFilters[key].length > 0) {
          eventsQuery = eventsQuery.in(key, selectedFilters[key]);
        }
      });

      const { data: eventsData, error: eventsError } = await eventsQuery;
      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      // 3. Now re-derive available options:
      // For city & space, we base on the spaces table but only for spaces that are referenced by these events.
      const eventSpaceIds = Array.from(
        new Set(eventsData.map((e) => e.space_id).filter(Boolean))
      );

      // Query spaces table to get details for these event space IDs.
      let finalSpacesData = [];
      if (eventSpaceIds.length > 0) {
        const { data: usedSpaces, error: usedSpacesError } = await supabase
          .from('spaces')
          .select('id, city, name');
        if (usedSpacesError) {
          console.error('Error fetching used spaces:', usedSpacesError);
          return;
        }
        finalSpacesData = usedSpaces.filter((s) =>
          eventSpaceIds.includes(s.id)
        );
      }
      const uniqueCities = Array.from(
        new Set(finalSpacesData.map((s) => s.city).filter(Boolean))
      );
      const uniqueSpaces = Array.from(
        new Set(finalSpacesData.map((s) => s.name).filter(Boolean))
      );
      // For flat fields, extract unique values from eventsData.
      const uniqueCategories = Array.from(
        new Set(eventsData.map((e) => e.category).filter(Boolean))
      );
      const uniqueDesigners = Array.from(
        new Set(eventsData.map((e) => e.designer).filter(Boolean))
      );
      const uniqueDates = Array.from(
        new Set(eventsData.map((e) => e.date).filter(Boolean))
      );

      // Sort text options alphabetically and dates descending.
      const sortAlpha = (arr) => [...arr].sort((a, b) => a.localeCompare(b));
      setCityOptions(sortAlpha(uniqueCities));
      setSpaceOptions(sortAlpha(uniqueSpaces));
      setCategoryOptions(sortAlpha(uniqueCategories));
      setDesignerOptions(sortAlpha(uniqueDesigners));
      uniqueDates.sort((a, b) => new Date(b) - new Date(a));
      setDateOptions(uniqueDates);
    } catch (err) {
      console.error('Error in fetchAvailableOptions:', err);
    }
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
