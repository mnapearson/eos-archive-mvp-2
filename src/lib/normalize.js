export function slugify(s = '') {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function toId(s = '') {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

export function normalizeValue(value) {
  return value ? String(value).trim() : '';
}

export function normalizeTime(time, fallback) {
  if (!time) return fallback;
  return time.length === 5 ? `${time}:00` : time;
}

export function normalizeType(type) {
  if (!type) return 'space';
  return String(type).toLowerCase();
}

// Airtable-synced spaces populate city_name; older "registered" spaces only
// populate the legacy city column. Root cause of a real bug (city blank for
// half the spaces) found and fixed in the pre-launch audit — kept as a
// single shared helper, with a regression test, so the fallback can't
// silently drop out of one call site again.
export function resolveCity(entity) {
  if (!entity) return '';
  return normalizeValue(entity.city_name ?? entity.city);
}
