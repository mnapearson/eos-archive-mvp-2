// src/contexts/FilterContext.js
'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { normalizeValue, resolveCity } from '@/lib/normalize';
import { eventMatchesFilters, deriveEventFields } from '@/lib/filterEvents';

export const FilterContext = createContext();

const FILTER_KEYS = ['city', 'space', 'date', 'category', 'designer'];

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
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);
  // Mirrors mobile's Map tab eventFilter: 'all' | 'today' | 'upcoming'.
  // Kept separate from selectedFilters since it's single-select, not an
  // array like the other filter dimensions.
  const [eventStatus, setEventStatus] = useState('all');

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // space_id -> earliest upcoming start_date (ISO string) / that event's
  // title, within the next 7 days — mirrors mobile's fetchEvents() window
  // exactly. Powers marker/card pulse-vs-ring state via getMarkerState()
  // without a separate query.
  const { eventMap, eventTitleMap } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const map = {};
    const titleMap = {};
    allEvents.forEach((event) => {
      const startDate = normalizeValue(event.start_date)
        ? normalizeValue(event.start_date).slice(0, 10)
        : '';
      if (!startDate || startDate < today || startDate > in7Days) return;
      const spaceId = event.space_id;
      if (spaceId == null) return;
      if (!map[spaceId] || startDate < map[spaceId]) {
        map[spaceId] = startDate;
        titleMap[spaceId] = event.title;
      }
    });
    return { eventMap: map, eventTitleMap: titleMap };
  }, [allEvents]);

  const spaceMap = useMemo(() => {
    const map = new Map();
    allSpaces.forEach((space) => {
      map.set(space.id, {
        ...space,
        name: normalizeValue(space.name),
        city: resolveCity(space),
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
      const city = resolveCity(space);
      const name = normalizeValue(space.name);
      if (city) cities.add(city);
      if (name) spaces.add(name);
    });

    allEvents.forEach((event) => {
      const category = normalizeValue(event.category);
      const date = normalizeValue(event.start_date)
        ? normalizeValue(event.start_date).slice(0, 10)
        : '';
      const fallbackCity = normalizeValue(event.city);
      if (category) categories.add(category);
      if (date) dates.add(date);
      (event.designers || []).forEach((d) => {
        const designer = normalizeValue(d);
        if (designer) designers.add(designer);
      });

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
    (filters, status = eventStatus) => {
      if (!allEvents.length) return [];

      return allEvents.reduce((acc, event) => {
        // Explore is a visual, flyer-led grid — an event with no flyer has
        // nothing to show there. This only affects what's rendered/counted
        // here, not allEvents itself, which eventMap (map marker state)
        // also derives from and should keep seeing every approved event.
        if (!event.image_url && !event.flyer_image_url) {
          return acc;
        }
        const space = spaceMap.get(event.space_id);
        if (!eventMatchesFilters(event, space, filters, status)) {
          return acc;
        }
        const { spaceName, spaceCity } = deriveEventFields(event, space);
        acc.push({
          ...event,
          space_name: spaceName,
          space_city: spaceCity,
          space_type: space?.category || space?.type,
        });
        return acc;
      }, []);
    },
    [allEvents, spaceMap, eventStatus]
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
        const { categoryValue, dateValue, spaceName, spaceCity, designerValues } =
          deriveEventFields(event, space);

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
            designerValues.forEach((value) => {
              counts.designer.set(value, (counts.designer.get(value) || 0) + 1);
            });
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

  const recentSpaces = useMemo(() => {
    if (!allSpaces.length || !allEvents.length) return [];

    const summaries = new Map();

    allEvents.forEach((event) => {
      const spaceId = event.space_id;
      if (!spaceId) return;
      const summary = summaries.get(spaceId) || {
        id: spaceId,
        name: spaceMap.get(spaceId)?.name || '',
        city: spaceMap.get(spaceId)?.city || '',
        eventCount: 0,
        latestEventDate: null,
      };

      summary.eventCount += 1;
      const createdAt = new Date(event.created_at || event.start_date || Date.now());
      if (!summary.latestEventDate || createdAt > summary.latestEventDate) {
        summary.latestEventDate = createdAt;
      }

      summaries.set(spaceId, summary);
    });

    return Array.from(summaries.values())
      .filter((space) => space.name)
      .sort((a, b) => (b.latestEventDate || 0) - (a.latestEventDate || 0))
      .slice(0, 3);
  }, [allEvents, allSpaces, spaceMap]);

  useEffect(() => {
    if (initializedFromQuery || loading) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const nextFilters = {};

    FILTER_KEYS.forEach((key) => {
      const values = params
        .getAll(key)
        .flatMap((entry) => entry.split(','))
        .map(normalizeValue)
        .filter(Boolean);
      if (values.length > 0) {
        nextFilters[key] = Array.from(new Set(values));
      }
    });

    if (Object.keys(nextFilters).length > 0) {
      setSelectedFilters((prev) => {
        let changed = false;
        const updated = { ...prev };
        FILTER_KEYS.forEach((key) => {
          if (nextFilters[key]) {
            const incoming = nextFilters[key];
            const current = prev[key] || [];
            if (
              incoming.length !== current.length ||
              incoming.some((value, idx) => value !== current[idx])
            ) {
              updated[key] = incoming;
              changed = true;
            }
          }
        });
        return changed ? updated : prev;
      });
    }

    setInitializedFromQuery(true);
  }, [initializedFromQuery, loading]);

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
      refetchFilterData: fetchData,
      recentSpaces,
      eventMap,
      eventTitleMap,
      eventStatus,
      setEventStatus,
      allSpaces,
    }),
    [
      selectedFilters,
      setSelectedFilters,
      filterOptions,
      optionCounts,
      filteredEvents,
      loading,
      error,
      fetchData,
      recentSpaces,
      eventMap,
      eventTitleMap,
      eventStatus,
      allSpaces,
    ]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
