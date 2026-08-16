import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { matchesEventStatus, deriveEventFields, eventMatchesFilters } from './filterEvents';

const EMPTY_FILTERS = { city: [], space: [], date: [], category: [], designer: [] };

describe('matchesEventStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('"all" matches any date, including empty', () => {
    expect(matchesEventStatus('2026-03-05', 'all')).toBe(true);
    expect(matchesEventStatus('', 'all')).toBe(true);
  });

  it('"today" matches today and tomorrow only', () => {
    expect(matchesEventStatus('2026-03-05', 'today')).toBe(true);
    expect(matchesEventStatus('2026-03-06', 'today')).toBe(true);
    expect(matchesEventStatus('2026-03-07', 'today')).toBe(false);
    expect(matchesEventStatus('2026-03-04', 'today')).toBe(false);
  });

  it('"upcoming" matches today through 7 days out', () => {
    expect(matchesEventStatus('2026-03-05', 'upcoming')).toBe(true);
    expect(matchesEventStatus('2026-03-12', 'upcoming')).toBe(true);
    expect(matchesEventStatus('2026-03-13', 'upcoming')).toBe(false);
    expect(matchesEventStatus('2026-03-04', 'upcoming')).toBe(false);
  });

  it('rejects a falsy date for any status other than "all"', () => {
    expect(matchesEventStatus('', 'today')).toBe(false);
    expect(matchesEventStatus(null, 'upcoming')).toBe(false);
  });
});

describe('deriveEventFields', () => {
  it('prefers the resolved space city over the event\'s own city field', () => {
    const space = { name: 'Zenner', city: 'Berlin' };
    const event = { city: 'Fallback City' };
    expect(deriveEventFields(event, space).spaceCity).toBe('Berlin');
  });

  it('falls back to the event\'s own city when there is no linked space', () => {
    const event = { city: 'Leipzig' };
    expect(deriveEventFields(event, undefined).spaceCity).toBe('Leipzig');
  });

  it('falls back to the event\'s own city when the space has no city set', () => {
    const space = { name: 'Unnamed Space', city: '' };
    const event = { city: 'Leipzig' };
    expect(deriveEventFields(event, space).spaceCity).toBe('Leipzig');
  });

  it('slices start_date down to the date portion', () => {
    expect(deriveEventFields({ start_date: '2026-03-05T20:00:00Z' }, null).dateValue).toBe(
      '2026-03-05'
    );
  });

  it('normalizes designers, dropping blanks', () => {
    const fields = deriveEventFields({ designers: [' Jane Doe ', '', null] }, null);
    expect(fields.designerValues).toEqual(['Jane Doe']);
  });
});

describe('eventMatchesFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  const space = { name: 'Zenner', city: 'Berlin' };
  const spaceNoCityName = { name: 'Modos-dever', city: 'Leipzig' }; // city_name-only space, already resolved via resolveCity before reaching here

  const baseEvent = {
    category: 'concert',
    start_date: '2026-03-06',
    designers: ['Jane Doe'],
  };

  it('matches with no filters applied', () => {
    expect(eventMatchesFilters(baseEvent, space, EMPTY_FILTERS)).toBe(true);
  });

  it('filters by category', () => {
    const filters = { ...EMPTY_FILTERS, category: ['concert'] };
    expect(eventMatchesFilters(baseEvent, space, filters)).toBe(true);
    expect(
      eventMatchesFilters({ ...baseEvent, category: 'exhibition' }, space, filters)
    ).toBe(false);
  });

  it('filters by city using the resolved (city_name-fallback) value', () => {
    const filters = { ...EMPTY_FILTERS, city: ['Leipzig'] };
    expect(eventMatchesFilters(baseEvent, spaceNoCityName, filters)).toBe(true);
    expect(eventMatchesFilters(baseEvent, space, filters)).toBe(false);
  });

  it('filters by space name', () => {
    const filters = { ...EMPTY_FILTERS, space: ['Zenner'] };
    expect(eventMatchesFilters(baseEvent, space, filters)).toBe(true);
    expect(eventMatchesFilters(baseEvent, spaceNoCityName, filters)).toBe(false);
  });

  it('filters by designer (any-match, not all-match)', () => {
    const filters = { ...EMPTY_FILTERS, designer: ['Jane Doe', 'Someone Else'] };
    expect(eventMatchesFilters(baseEvent, space, filters)).toBe(true);
    expect(
      eventMatchesFilters({ ...baseEvent, designers: ['Nobody Relevant'] }, space, filters)
    ).toBe(false);
  });

  it('filters by event status alongside other filters (AND, not OR)', () => {
    const filters = { ...EMPTY_FILTERS, category: ['concert'] };
    // Right category, but date is 3 days out — fails "today" (today/tomorrow only)
    expect(
      eventMatchesFilters({ ...baseEvent, start_date: '2026-03-08' }, space, filters, 'today')
    ).toBe(false);
    // Right category AND within the "today" window (baseEvent's date is tomorrow)
    expect(eventMatchesFilters(baseEvent, space, filters, 'today')).toBe(true);
  });

  it('combines multiple simultaneous filters with AND logic', () => {
    const filters = {
      city: ['Berlin'],
      category: ['concert'],
      space: ['Zenner'],
      date: [],
      designer: [],
    };
    // Matches every dimension
    expect(eventMatchesFilters(baseEvent, space, filters)).toBe(true);
    // Right city+space, wrong category — should fail
    expect(
      eventMatchesFilters({ ...baseEvent, category: 'workshop' }, space, filters)
    ).toBe(false);
    // Right category, wrong city (space resolves to Leipzig) — should fail
    expect(eventMatchesFilters(baseEvent, spaceNoCityName, filters)).toBe(false);
  });

  it('rejects an event with no linked space when a city filter is active', () => {
    const filters = { ...EMPTY_FILTERS, city: ['Berlin'] };
    expect(eventMatchesFilters(baseEvent, undefined, filters)).toBe(false);
  });
});
