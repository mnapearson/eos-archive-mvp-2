// Ported from eos-archive-app/lib/cityCoordinates.ts — keep in sync with
// that file. Used to center the map on a city even when it currently has
// zero spaces, and to resolve city pill -> map camera moves.
export const CITY_COORDINATES = {
  Paris: { lat: 48.8566, lng: 2.3522 },
  Berlin: { lat: 52.52, lng: 13.405 },
  Barcelona: { lat: 41.3851, lng: 2.1734 },
  London: { lat: 51.5074, lng: -0.1278 },
  Athens: { lat: 37.9838, lng: 23.7275 },
  Tbilisi: { lat: 41.6938, lng: 44.8015 },
  'New York': { lat: 40.7128, lng: -74.006 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  Seoul: { lat: 37.5665, lng: 126.978 },
  Arles: { lat: 43.6767, lng: 4.6278 },
  // Cities already present in Supabase via the legacy `city` column
  // (not yet backfilled into `city_name`) — kept here so they don't
  // silently disappear from the filter pills once switched to the
  // live Supabase-driven city list.
  Leipzig: { lat: 51.3397, lng: 12.3731 },
  Dresden: { lat: 51.0504, lng: 13.7373 },
  Bremerhaven: { lat: 53.5396, lng: 8.5809 },
  Brussels: { lat: 50.8503, lng: 4.3517 },
  Madrid: { lat: 40.4168, lng: -3.7038 },
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  Bagnolet: { lat: 48.8703, lng: 2.4183 },
  Chars: { lat: 49.1667, lng: 1.9167 },
  'Saint-Ouen': { lat: 48.9106, lng: 2.3345 },
  Marseille: { lat: 43.2965, lng: 5.3698 },
  Munich: { lat: 48.1351, lng: 11.582 },
  Glasgow: { lat: 55.8642, lng: -4.2518 },
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Bucharest: { lat: 44.4268, lng: 26.1025 },
  Vancouver: { lat: 49.2827, lng: -123.1207 },
};

export const DEFAULT_CITY = 'Paris';
