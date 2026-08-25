// src/lib/mapboxStatic.js
//
// Builds a Mapbox Static Images API URL — same dark-v11 style and pin
// marker approach already used by src/lib/og.js (OG fallback images) and
// eos-archive-app/lib/utils.ts's mapboxStaticImage (mobile), but with the
// marker color parameterized instead of a fixed hex, since callers here
// need it tinted to an event's category color (markerColors.js).
export function mapboxThumbnail(lng, lat, colorHex, { width = 480, height = 360, zoom = 13 } = {}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || lng == null || lat == null) return null;
  const color = String(colorHex || '').replace('#', '');
  const marker = `pin-s+${color}(${lng},${lat})`;
  const center = `${lng},${lat},${zoom},0`;
  const size = `${width}x${height}@2x`;
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${marker}/${center}/${size}?access_token=${token}`;
}
