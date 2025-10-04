// src/contexts/FilterContext.js
'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const FilterContext = createContext();

const FILTER_KEYS = ['city', 'space', 'date', 'category', 'designer'];

function normalizeValue(value) {
  return value ? String(value).trim() : '';
}

export function FilterProvider({ children }) {
  const [selectedFilters, setSelectedFilters] = useState({
    city: [],
    space: [],
    date: [],
    category: [],
    designer: [],
  });

  const [allEvents, setAllEvents] = useState([]);
  const [allSpaces, setAllSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [eventsResponse, spacesResponse] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/spaces'),
        ]);

        if (!eventsResponse.ok) {
          const payload = await eventsResponse.json().catch(() => ({}));
          throw new Error(
            payload?.error || `Failed to load events (${eventsResponse.status})`
          );
        }
        if (!spacesResponse.ok) {
          const payload = await spacesResponse.json().catch(() => ({}));
          throw new Error(
            payload?.error || `Failed to load spaces (${spacesResponse.status})`
          );
        }

        const eventsData = await eventsResponse.json();
        const spacesData = await spacesResponse.json();

        setAllEvents((eventsData || []).filter((event) => event.approved));
        setAllSpaces(spacesData || []);
      } catch (err) {
        console.error('Error fetching filter data:', err);
        setAllEvents([]);
        setAllSpaces([]);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const spaceMap = useMemo(() => {
    const map = new Map();
    allSpaces.forEach((space) => {
      map.set(space.id, {
        ...space,
        name: normalizeValue(space.name),
        city: normalizeValue(space.city),
      });
    });
    return map;
  }, [allSpaces]);

  const filterOptions = useMemo(() => {
    const cities = new Set();
    const spaces = new Set();
    const dates = new Set();
    const categories = new Set();
    const designers = new Set();

    allSpaces.forEach((space) => {
      const city = normalizeValue(space.city);
      const name = normalizeValue(space.name);
      if (city) cities.add(city);
      if (name) spaces.add(name);
    });

    allEvents.forEach((event) => {
      const category = normalizeValue(event.category);
      const designer = normalizeValue(event.designer);
      const date = normalizeValue(event.start_date)
        ? normalizeValue(event.start_date).slice(0, 10)
        : '';
      const fallbackCity = normalizeValue(event.city);

      if (category) categories.add(category);
      if (designer) designers.add(designer);
      if (date) dates.add(date);

      if (fallbackCity && !cities.has(fallbackCity)) {
        cities.add(fallbackCity);
      }
    });

    const sortAlpha = (arr) => Array.from(arr).sort((a, b) => a.localeCompare(b));
    const sortDates = (arr) =>
      Array.from(arr)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a));

    return {
      city: sortAlpha(cities),
      space: sortAlpha(spaces),
      date: sortDates(dates),
      category: sortAlpha(categories),
      designer: sortAlpha(designers),
    };
  }, [allEvents, allSpaces]);

  const applyFilters = useCallback(
    (filters) => {
      if (!allEvents.length) return [];

      return allEvents.reduce((acc, event) => {
        const categoryValue = normalizeValue(event.category);
        const designerValue = normalizeValue(event.designer);
        const dateValue = normalizeValue(event.start_date)
          ? normalizeValue(event.start_date).slice(0, 10)
          : '';
        const space = spaceMap.get(event.space_id);
        const spaceName = space?.name || '';
        const spaceCity = space?.city || normalizeValue(event.city);

        if (
          filters.category.length > 0 &&
          !filters.category.includes(categoryValue)
        ) {
          return acc;
        }

        if (
          filters.designer.length > 0 &&
          !filters.designer.includes(designerValue)
        ) {
          return acc;
        }

        if (filters.date.length > 0 && !filters.date.includes(dateValue)) {
          return acc;
        }

        if (filters.space.length > 0 && !filters.space.includes(spaceName)) {
          return acc;
        }

        if (filters.city.length > 0 && !filters.city.includes(spaceCity)) {
          return acc;
        }

        acc.push({
          ...event,
          space_name: spaceName,
          space_city: spaceCity,
        });
        return acc;
      }, []);
    },
    [allEvents, spaceMap]
  );

  const filteredEvents = useMemo(
    () => applyFilters(selectedFilters),
    [applyFilters, selectedFilters]
  );

  const optionCounts = useMemo(() => {
    const counts = {
      city: new Map(),
      space: new Map(),
      date: new Map(),
      category: new Map(),
      designer: new Map(),
    };

    FILTER_KEYS.forEach((key) => {
      const baseFilters = { ...selectedFilters, [key]: [] };
      const eventsForCounts = applyFilters(baseFilters);

      eventsForCounts.forEach((event) => {
        const space = spaceMap.get(event.space_id);
        const categoryValue = normalizeValue(event.category);
        const designerValue = normalizeValue(event.designer);
        const dateValue = normalizeValue(event.start_date)
          ? normalizeValue(event.start_date).slice(0, 10)
          : '';
        const spaceName = space?.name || '';
        const spaceCity = space?.city || normalizeValue(event.city);

        switch (key) {
          case 'city': {
            const value = spaceCity;
            if (value) {
              counts.city.set(value, (counts.city.get(value) || 0) + 1);
            }
            break;
          }
          case 'space': {
            const value = spaceName;
            if (value) {
              counts.space.set(value, (counts.space.get(value) || 0) + 1);
            }
            break;
          }
          case 'date': {
            const value = dateValue;
            if (value) {
              counts.date.set(value, (counts.date.get(value) || 0) + 1);
            }
            break;
          }
          case 'category': {
            const value = categoryValue;
            if (value) {
              counts.category.set(
                value,
                (counts.category.get(value) || 0) + 1
              );
            }
            break;
          }
          case 'designer': {
            const value = designerValue;
            if (value) {
              counts.designer.set(
                value,
                (counts.designer.get(value) || 0) + 1
              );
            }
            break;
          }
          default:
            break;
        }
      });
    });

    const mapToObject = (options, map) => {
      const obj = {};
      options.forEach((value) => {
        obj[value] = map.get(value) || 0;
      });
      return obj;
    };

    return {
      city: mapToObject(filterOptions.city, counts.city),
      space: mapToObject(filterOptions.space, counts.space),
      date: mapToObject(filterOptions.date, counts.date),
      category: mapToObject(filterOptions.category, counts.category),
      designer: mapToObject(filterOptions.designer, counts.designer),
    };
  }, [applyFilters, filterOptions, selectedFilters, spaceMap]);

  const value = useMemo(
    () => ({
      selectedFilters,
      setSelectedFilters,
      cityOptions: filterOptions.city,
      spaceOptions: filterOptions.space,
      dateOptions: filterOptions.date,
      categoryOptions: filterOptions.category,
      designerOptions: filterOptions.designer,
      optionCounts,
      filteredEvents,
      filtersLoading: loading,
      filtersError: error,
    }),
    [
      selectedFilters,
      setSelectedFilters,
      filterOptions,
      optionCounts,
      filteredEvents,
      loading,
      error,
    ]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
