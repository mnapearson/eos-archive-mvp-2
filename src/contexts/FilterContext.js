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
    fetchAvailableOptions();
  }, [selectedFilters]);

  async function fetchAvailableOptions() {
    try {
      // 1. Filter spaces by city if city is selected
      let cityFilteredSpaces = [];
      if (selectedFilters.city.length > 0) {
        // Query spaces for only the selected cities
        const { data: citySpaces, error: citySpacesError } = await supabase
          .from('spaces')
          .select('id, city, name')
          .in('city', selectedFilters.city);

        if (citySpacesError) {
          console.error('Error fetching city spaces:', citySpacesError);
          return;
        }
        cityFilteredSpaces = citySpaces; // only spaces matching the selected city filter
      } else {
        // If no city is selected, all spaces are valid
        const { data: allSpaces, error: allSpacesError } = await supabase
          .from('spaces')
          .select('id, city, name');
        if (allSpacesError) {
          console.error('Error fetching all spaces:', allSpacesError);
          return;
        }
        cityFilteredSpaces = allSpaces;
      }

      // Extract the space IDs that pass the city filter
      const citySpaceIds = cityFilteredSpaces.map((s) => s.id);

      // 2. Filter events by the resulting space IDs
      let eventsQuery = supabase
        .from('events')
        .select('id, space_id, date, category, designer');

      // Only keep events whose space_id is in citySpaceIds
      if (citySpaceIds.length > 0) {
        eventsQuery = eventsQuery.in('space_id', citySpaceIds);
      } else {
        // If citySpaceIds is empty, no spaces match city => no events
        // but let's see if user actually wants no city filter or it's truly empty
        if (selectedFilters.city.length > 0) {
          // If city filter is chosen but no spaces found, we can short-circuit
          setCityOptions([]); // no city
          setSpaceOptions([]); // no space
          setCategoryOptions([]);
          setDesignerOptions([]);
          setDateOptions([]);
          return;
        }
        // If city filter is empty, then all spaces are allowed, so no .in('space_id', []) is needed
      }

      // 3. Apply other event filters: date, category, designer
      if (selectedFilters.date.length > 0) {
        eventsQuery = eventsQuery.in('date', selectedFilters.date);
      }
      if (selectedFilters.category.length > 0) {
        eventsQuery = eventsQuery.in('category', selectedFilters.category);
      }
      if (selectedFilters.designer.length > 0) {
        eventsQuery = eventsQuery.in('designer', selectedFilters.designer);
      }

      const { data: eventsData, error: eventsError } = await eventsQuery;
      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      // 4. Re-derive space options from the final set of events
      // Collect all space IDs from these events
      const finalSpaceIds = Array.from(
        new Set(eventsData.map((e) => e.space_id).filter(Boolean))
      );

      // The final spaces we want are the intersection of citySpaceIds and finalSpaceIds
      // because we might have city filter + other filters
      const usedSpaceIds = finalSpaceIds.filter((id) =>
        citySpaceIds.includes(id)
      );

      // Now fetch the used spaces from the spaces table
      let usedSpacesData = [];
      if (usedSpaceIds.length > 0) {
        const { data: usedSpaces, error: usedSpacesError } = await supabase
          .from('spaces')
          .select('id, city, name')
          .in('id', usedSpaceIds);

        if (usedSpacesError) {
          console.error('Error fetching used spaces:', usedSpacesError);
          return;
        }
        usedSpacesData = usedSpaces;
      }

      // 5. Derive unique sets for city, space, category, designer, date
      const uniqueCities = Array.from(
        new Set(usedSpacesData.map((s) => s.city).filter(Boolean))
      );
      const uniqueSpaces = Array.from(
        new Set(usedSpacesData.map((s) => s.name).filter(Boolean))
      );

      const uniqueCategories = Array.from(
        new Set(eventsData.map((e) => e.category).filter(Boolean))
      );
      const uniqueDesigners = Array.from(
        new Set(eventsData.map((e) => e.designer).filter(Boolean))
      );
      const uniqueDates = Array.from(
        new Set(eventsData.map((e) => e.date).filter(Boolean))
      );

      // Sort them
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
