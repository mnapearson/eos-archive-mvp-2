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
    fetchApprovedOptions();
  }, [selectedFilters]);

  async function fetchApprovedOptions() {
    try {
      // 1. Query the events table for approved events only.
      let eventsQuery = supabase
        .from('events')
        .select('id, space_id, date, category, designer')
        .eq('approved', true);

      // 2. Apply event-based filters (date, category, designer) if any.
      // We do NOT filter by city or space here because those live in the spaces table.
      ['date', 'category', 'designer'].forEach((key) => {
        if (selectedFilters[key] && selectedFilters[key].length > 0) {
          eventsQuery = eventsQuery.in(key, selectedFilters[key]);
        }
      });

      const { data: eventsData, error: eventsError } = await eventsQuery;
      if (eventsError) {
        console.error('Error fetching approved events:', eventsError);
        return;
      }

      // 3. Gather unique space IDs from the filtered, approved events
      const eventSpaceIds = Array.from(
        new Set(eventsData.map((e) => e.space_id).filter(Boolean))
      );

      // If no events are found after filters, reset all options and return
      if (eventSpaceIds.length === 0 && eventsData.length === 0) {
        setCityOptions([]);
        setSpaceOptions([]);
        setDateOptions([]);
        setCategoryOptions([]);
        setDesignerOptions([]);
        return;
      }

      // 4. Now we must filter the spaces by city/space if the user selected them.
      // If user selected city filters, we query spaces for those cities & intersect with eventSpaceIds.
      let spacesQuery = supabase.from('spaces').select('id, city, name');

      const { data: allSpaces, error: spacesError } = await spacesQuery;
      if (spacesError) {
        console.error('Error fetching spaces:', spacesError);
        return;
      }

      // Filter to only those spaces that appear in eventSpaceIds
      let filteredSpaces = allSpaces.filter((s) =>
        eventSpaceIds.includes(s.id)
      );

      // If user selected city filters, reduce further
      if (selectedFilters.city && selectedFilters.city.length > 0) {
        filteredSpaces = filteredSpaces.filter((s) =>
          selectedFilters.city.includes(s.city)
        );
      }

      // If user selected space filters, reduce further
      if (selectedFilters.space && selectedFilters.space.length > 0) {
        filteredSpaces = filteredSpaces.filter((s) =>
          selectedFilters.space.includes(s.name)
        );
      }

      // 5. Re-derive the final space IDs from these filtered spaces
      const finalSpaceIds = filteredSpaces.map((s) => s.id);

      // 6. Filter the eventsData to only keep events whose space_id is in finalSpaceIds
      const finalEvents = eventsData.filter((e) =>
        finalSpaceIds.includes(e.space_id)
      );

      // 7. Build unique sets for city, space, date, category, designer from final data
      // For city and space, we use the finalSpaces
      const uniqueCities = Array.from(
        new Set(filteredSpaces.map((s) => s.city).filter(Boolean))
      );
      const uniqueSpaces = Array.from(
        new Set(filteredSpaces.map((s) => s.name).filter(Boolean))
      );

      // For date, category, designer, we use the finalEvents
      const uniqueDates = Array.from(
        new Set(finalEvents.map((e) => e.date).filter(Boolean))
      );
      const uniqueCategories = Array.from(
        new Set(finalEvents.map((e) => e.category).filter(Boolean))
      );
      const uniqueDesigners = Array.from(
        new Set(finalEvents.map((e) => e.designer).filter(Boolean))
      );

      // Sort text options alphabetically, dates descending
      const sortAlpha = (arr) => [...arr].sort((a, b) => a.localeCompare(b));
      setCityOptions(sortAlpha(uniqueCities));
      setSpaceOptions(sortAlpha(uniqueSpaces));
      setCategoryOptions(sortAlpha(uniqueCategories));
      setDesignerOptions(sortAlpha(uniqueDesigners));

      uniqueDates.sort((a, b) => new Date(b) - new Date(a));
      setDateOptions(uniqueDates);
    } catch (err) {
      console.error('Error in fetchApprovedOptions:', err);
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
