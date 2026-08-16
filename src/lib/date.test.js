import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatDateRange } from './date';

describe('formatDate', () => {
  it('formats an ISO date as "d MMM yyyy"', () => {
    expect(formatDate('2026-03-05')).toBe('5 Mar 2026');
  });

  it('returns empty string for null/undefined/empty input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('returns empty string for unparseable input rather than throwing', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('formatTime', () => {
  it('formats a 24h time string as "HH:mm"', () => {
    expect(formatTime('14:30:00')).toBe('14:30');
  });

  it('returns empty string for null/undefined/empty input', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
    expect(formatTime('')).toBe('');
  });

  it('returns empty string for unparseable input rather than throwing', () => {
    expect(formatTime('not-a-time')).toBe('');
  });
});

describe('formatDateRange', () => {
  it('formats a single date with no times', () => {
    expect(formatDateRange('2026-03-05')).toBe('5 Mar 2026');
  });

  it('formats a same-day range as a single date (end === start)', () => {
    expect(formatDateRange('2026-03-05', '2026-03-05')).toBe('5 Mar 2026');
  });

  it('formats a cross-day range with an en dash', () => {
    expect(formatDateRange('2026-03-05', '2026-03-07')).toBe(
      '5 Mar 2026 – 7 Mar 2026'
    );
  });

  it('appends a single start time when only start time is given', () => {
    expect(formatDateRange('2026-03-05', null, '20:00:00')).toBe(
      '5 Mar 2026 @ 20:00'
    );
  });

  it('appends a start–end time range when both times differ', () => {
    expect(formatDateRange('2026-03-05', null, '20:00:00', '23:00:00')).toBe(
      '5 Mar 2026 @ 20:00 – 23:00'
    );
  });

  it('omits the end time when it equals the start time', () => {
    expect(formatDateRange('2026-03-05', null, '20:00:00', '20:00:00')).toBe(
      '5 Mar 2026 @ 20:00'
    );
  });

  it('combines a cross-day date range with a time range', () => {
    expect(
      formatDateRange('2026-03-05', '2026-03-07', '20:00:00', '02:00:00')
    ).toBe('5 Mar 2026 – 7 Mar 2026 @ 20:00 – 02:00');
  });

  it('returns empty string when start is null/undefined', () => {
    expect(formatDateRange(null)).toBe('');
    expect(formatDateRange(undefined)).toBe('');
  });
});
