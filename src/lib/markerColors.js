const markerColors = {
  'art space': '#841FFF', // LEICO purple
  bar: '#1F51FF', // neon blue
  cafe: '#39FF14', // neon green
  museum: '#FFFF00', // neon yellow
  kino: '#FF073A', // neon red
  club: '#FF6EC7', // neon pink
  studio: '#FF5F1F', // neon orange
  other: '#FFFFFF', // default white
  theatre: '#04FFF7', // neon turquoise
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
