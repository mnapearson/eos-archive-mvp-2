// src/lib/og.js

/**
 * Build a static Mapbox image URL centered on a location, styled for use
 * as an Open Graph fallback image (dark map, chrome pin).
 * @param {number} lng
 * @param {number} lat
 * @param {string} token
 * @returns {string}
 */
export function mapboxOgImage(lng, lat, token) {
  const marker = `pin-s+7ab4d4(${lng},${lat})`;
  const center = `${lng},${lat},13,0`;
  const size = `1200x630@2x`;
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${marker}/${center}/${size}?access_token=${token}`;
}
