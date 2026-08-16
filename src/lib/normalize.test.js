import { describe, it, expect } from 'vitest';
import {
  slugify,
  toId,
  normalizeValue,
  normalizeTime,
  normalizeType,
  resolveCity,
} from './normalize';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify("Café d'Été!")).toBe('caf-d-t');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  --Leading and trailing--  ')).toBe('leading-and-trailing');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('defaults to empty string when called with no argument', () => {
    expect(slugify()).toBe('');
  });

  it('handles fully non-Latin input by collapsing to nothing', () => {
    // The regex only keeps [a-z0-9] — non-Latin scripts are stripped
    // entirely, which is documented current behavior, not asserting it's
    // ideal i18n handling.
    expect(slugify('東京')).toBe('');
  });
});

describe('toId', () => {
  it('lowercases, trims, and hyphenates whitespace', () => {
    expect(toId('  Some Value  ')).toBe('some-value');
  });

  it('strips characters outside [a-z0-9_-]', () => {
    expect(toId('Art/Space!')).toBe('artspace');
  });

  it('defaults to empty string when called with no argument', () => {
    expect(toId()).toBe('');
  });

  it('coerces non-string input via String()', () => {
    expect(toId(123)).toBe('123');
  });
});

describe('normalizeValue', () => {
  it('trims whitespace', () => {
    expect(normalizeValue('  hello  ')).toBe('hello');
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(normalizeValue(null)).toBe('');
    expect(normalizeValue(undefined)).toBe('');
    expect(normalizeValue('')).toBe('');
  });

  it('coerces non-string values', () => {
    expect(normalizeValue(42)).toBe('42');
  });
});

describe('normalizeTime', () => {
  it('appends :00 to HH:MM-length strings', () => {
    expect(normalizeTime('14:30')).toBe('14:30:00');
  });

  it('leaves already-seconds-precision strings unchanged', () => {
    expect(normalizeTime('14:30:00')).toBe('14:30:00');
  });

  it('returns the fallback for falsy input', () => {
    expect(normalizeTime(null, 'TBD')).toBe('TBD');
    expect(normalizeTime('', 'TBD')).toBe('TBD');
    expect(normalizeTime(undefined)).toBeUndefined();
  });
});

describe('normalizeType', () => {
  it('lowercases the type', () => {
    expect(normalizeType('Bar')).toBe('bar');
  });

  it('falls back to the literal string "space" for falsy input', () => {
    // Documented current behavior — normalizeType(null) does NOT return
    // 'other'. This exact gap (SpaceListItem calling normalizeType(space.type)
    // with no category fallback) shipped a real "SPACE" label bug to
    // production; see resolveCity's callers for the pattern that replaced it.
    expect(normalizeType(null)).toBe('space');
    expect(normalizeType(undefined)).toBe('space');
    expect(normalizeType('')).toBe('space');
  });

  it('coerces non-string input', () => {
    expect(normalizeType(123)).toBe('123');
  });
});

describe('resolveCity', () => {
  it('prefers city_name when both are set', () => {
    expect(resolveCity({ city_name: 'Berlin', city: 'Leipzig' })).toBe('Berlin');
  });

  it('falls back to the legacy city column when city_name is not set', () => {
    // Regression test: Airtable-synced spaces only populate city_name;
    // older "registered" spaces only populate city. A space with only
    // city_name set previously showed a blank city on some pages — the
    // exact bug fixed in the pre-launch audit.
    expect(resolveCity({ city_name: null, city: 'Leipzig' })).toBe('Leipzig');
    expect(resolveCity({ city: 'Leipzig' })).toBe('Leipzig');
  });

  it('returns empty string when neither field is set', () => {
    expect(resolveCity({})).toBe('');
  });

  it('returns empty string for null/undefined entity', () => {
    expect(resolveCity(null)).toBe('');
    expect(resolveCity(undefined)).toBe('');
  });

  it('trims whitespace via normalizeValue', () => {
    expect(resolveCity({ city_name: '  Berlin  ' })).toBe('Berlin');
  });
});
