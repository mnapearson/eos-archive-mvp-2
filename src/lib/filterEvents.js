import { normalizeValue } from './normalize';

// Mirrors getMarkerState's live ('today') vs soon ('upcoming') thresholds
// (src/lib/markerState.js), applied to a single event's own start_date
// rather than a space's earliest event.
export function matchesEventStatus(startDate, status) {
  if (status === 'all') return true;
  if (!startDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  if (status === 'today') return startDate >= today && startDate <= tomorrow;
  if (status === 'upcoming') return startDate >= today && startDate <= in7Days;
  return true;
}

// space is the FilterContext spaceMap entry for event.space_id (already
// carrying the city_name/city fallback via resolveCity), or undefined.
export function deriveEventFields(event, space) {
  const categoryValue = normalizeValue(event.category);
  const dateValue = normalizeValue(event.start_date)
    ? normalizeValue(event.start_date).slice(0, 10)
    : '';
  const spaceName = space?.name || '';
  // Falls back to the event's own city (and, failing that, resolveCity
  // wouldn't apply here since event has no city_name field) when the event
  // isn't linked to a known space.
  const spaceCity = space?.city || normalizeValue(event.city);
  const designerValues = (event.designers || [])
    .map((d) => normalizeValue(d))
    .filter(Boolean);
  return { categoryValue, dateValue, spaceName, spaceCity, designerValues };
}

// Pure AND-combination of every filter dimension FilterContext supports —
// extracted so it's testable without React/context machinery.
export function eventMatchesFilters(event, space, filters, eventStatus = 'all') {
  const { categoryValue, dateValue, spaceName, spaceCity, designerValues } =
    deriveEventFields(event, space);

  if (!matchesEventStatus(dateValue, eventStatus)) return false;

  if (filters.category?.length > 0 && !filters.category.includes(categoryValue)) {
    return false;
  }
  if (filters.date?.length > 0 && !filters.date.includes(dateValue)) {
    return false;
  }
  if (filters.space?.length > 0 && !filters.space.includes(spaceName)) {
    return false;
  }
  if (filters.city?.length > 0 && !filters.city.includes(spaceCity)) {
    return false;
  }
  if (
    filters.designer?.length > 0 &&
    !filters.designer.some((d) => designerValues.includes(d))
  ) {
    return false;
  }

  return true;
}
