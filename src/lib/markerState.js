// Ported from eos-archive-app/lib/utils.ts (getMarkerState) so the web map
// and cards read event freshness identically to mobile. Compares plain ISO
// date strings throughout — never construct Date objects for this
// comparison, that reintroduces timezone drift the string comparison avoids.

export function getMarkerState(spaceId, eventMap) {
  const nextDate = eventMap[spaceId];
  if (!nextDate) return 'default';
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return nextDate <= tomorrow ? 'live' : 'soon';
}
