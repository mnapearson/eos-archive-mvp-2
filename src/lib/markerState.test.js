import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getMarkerState } from './markerState';

describe('getMarkerState', () => {
  beforeEach(() => {
    // Frozen "today" — never let this depend on the real current date.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "default" when the space has no entry in eventMap', () => {
    expect(getMarkerState(1, {})).toBe('default');
    expect(getMarkerState(1, { 2: '2026-03-06' })).toBe('default');
  });

  it('returns "live" when the next event is today', () => {
    expect(getMarkerState(1, { 1: '2026-03-05' })).toBe('live');
  });

  it('returns "live" when the next event is tomorrow', () => {
    expect(getMarkerState(1, { 1: '2026-03-06' })).toBe('live');
  });

  it('returns "soon" when the next event is more than a day out', () => {
    expect(getMarkerState(1, { 1: '2026-03-08' })).toBe('soon');
  });

  it('returns "soon" for a date exactly one day beyond tomorrow', () => {
    expect(getMarkerState(1, { 1: '2026-03-07' })).toBe('soon');
  });

  it('treats a past date as "live" (documented current behavior)', () => {
    // getMarkerState only checks nextDate <= tomorrow, with no lower
    // bound — a stale/past date would read as "live". In practice this
    // never happens because eventMap is only ever populated with dates
    // >= today upstream (FilterContext), but the pure function itself
    // has no such guard, so this pins the actual behavior rather than
    // an assumption about it.
    expect(getMarkerState(1, { 1: '2026-03-01' })).toBe('live');
  });
});
