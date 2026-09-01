// GENERATED FILE — do not edit by hand.
// Source: eos-archive-app/constants/theme.ts's categoryColors (the
// reference design). Regenerate with `npm run sync-tokens` after
// changing theme.ts. Keys are lowercased from theme.ts's Title Case to
// match this file's existing lookup convention (normalizeType() already
// lowercases whatever category string it's given).
const markerColors = {
  'art space': '#a78bfa',
  'bar': '#60a5fa',
  'cafe': '#4ade80',
  'club': '#f472b6',
  'museum': '#fbbf24',
  'studio': '#fb923c',
  'theatre': '#22d3ee',
  'venue': '#f87171',
  'other': '#94a3b8',
};

export const CATEGORY_ABBREV = {
  'art space': 'ART',
  bar: 'BAR',
  cafe: 'CAFE',
  club: 'CLUB',
  museum: 'MUS',
  studio: 'STU',
  theatre: 'THE',
  venue: 'VEN',
  other: 'OTH',
};

export function getMarkerTextColor(hex) {
  if (!hex || hex.length < 7) return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1b1b1b' : '#fff';
}

export default markerColors;
