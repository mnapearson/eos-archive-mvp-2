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
