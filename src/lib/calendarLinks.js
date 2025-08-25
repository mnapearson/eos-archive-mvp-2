// src/lib/calendarLinks.js

function toUTCDateTimeString(d) {
  // -> YYYYMMDDTHHMMSSZ
  return new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
function toDateOnly(d) {
  // -> YYYYMMDD
  return new Date(d).toISOString().slice(0, 10).replaceAll('-', '');
}
function hasTimePart(iso) {
  return typeof iso === 'string' && iso.includes('T');
}
function escapeICS(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

// Normalize a time string to HH:MM (24h). Accepts "18", "18:00", "18.00", "6pm", etc. (simple)
function normalizeTimeStr(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();

  // Replace dot with colon, trim spaces
  s = s.replace(/\./g, ':').replace(/\s+/g, '');

  // Handle "pm/am" quickly (very simple)
  const pm = s.endsWith('pm');
  const am = s.endsWith('am');
  if (pm || am) s = s.replace(/am|pm/g, '');

  // If it's a range "18-22" or "18:00–22:30", the caller should split first; this normalizes a single time
  // Ensure we have hours and minutes
  if (/^\d{1,2}$/.test(s)) s = `${s}:00`;
  if (/^\d{1,2}:\d{1,2}$/.test(s) === false) {
    // Try to extract HH and MM digits
    const m = s.match(/^(\d{1,2})[:]?(\d{2})?/);
    if (m) s = `${m[1].padStart(2, '0')}:${(m[2] || '00').padStart(2, '0')}`;
  }

  // Re-apply pm logic (naive)
  if (pm) {
    const [hh, mm] = s.split(':');
    const hNum = Number(hh);
    if (hNum >= 1 && hNum <= 11)
      s = `${String(hNum + 12).padStart(2, '0')}:${mm}`;
    if (hNum === 12) s = `12:${mm}`;
  } else if (am) {
    const [hh, mm] = s.split(':');
    const hNum = Number(hh);
    if (hNum === 12) s = `00:${mm}`;
  }

  return s;
}

// Split a possible time range string like "18-22" or "18:00–22:30"
function splitTimeRange(raw) {
  if (!raw) return { start: null, end: null };
  const s = String(raw).replace(/\s/g, '');
  const parts = s.split(/-|–|—|to/i);
  if (parts.length >= 2) {
    return {
      start: normalizeTimeStr(parts[0]),
      end: normalizeTimeStr(parts[1]),
    };
  }
  return { start: normalizeTimeStr(raw), end: null };
}

// Build a local ISO string ("YYYY-MM-DDTHH:MM") to feed into Date(), which will interpret in the user's local tz
function combineLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const t = normalizeTimeStr(timeStr);
  if (!t) return null;
  return `${dateStr}T${t}:00`; // seconds added
}

// Returns { googleUrl, icsText }
export function buildCalendarArtifacts(event, override = {}) {
  const {
    id = event.id,
    title = override.title ?? event.title ?? 'Event',
    description = override.description ?? event.description ?? '',
    location = override.location ?? event.location ?? event.city ?? '',
    url = override.url ?? event.url ?? event.website ?? '',
    start = override.start ?? event.start_date,
    end = override.end ?? event.end_date,
  } = {};

  // Optional time fields we’ll interpret if start has no time
  const startTimeRaw =
    override.start_time ?? event.start_time ?? event.time ?? null;
  const endTimeRaw = override.end_time ?? event.end_time ?? null;

  if (!start) return { googleUrl: null, icsText: null };

  const nowUtc = toUTCDateTimeString(new Date());
  const uid = `eosarchive-${
    id || Math.random().toString(36).slice(2)
  }@eosarchive.app`;

  let googleDates = '';
  let ics = '';

  // Determine if we will build a timed event
  const { start: rangeStartFromTime, end: rangeEndFromTime } =
    splitTimeRange(startTimeRaw);
  const haveTime = hasTimePart(start) || Boolean(rangeStartFromTime);

  if (haveTime) {
    // Timed event
    const startLocalISO = hasTimePart(start)
      ? start
      : combineLocalDateTime(start, rangeStartFromTime);

    const endLocalISO = (() => {
      const endCandidate = endTimeRaw || rangeEndFromTime;
      if (endCandidate) {
        const endDateBase = end || start;
        return combineLocalDateTime(endDateBase, endCandidate);
      }
      // default +2h if no end time provided
      return new Date(new Date(startLocalISO).getTime() + 2 * 60 * 60 * 1000);
    })();

    const dtStart = toUTCDateTimeString(startLocalISO);
    const dtEnd = toUTCDateTimeString(endLocalISO);

    googleDates = `${dtStart}/${dtEnd}`;

    ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//eos archive//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(title)}`,
      description ? `DESCRIPTION:${escapeICS(description)}` : null,
      location ? `LOCATION:${escapeICS(location)}` : null,
      url ? `URL:${escapeICS(url)}` : null,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');
  } else {
    // All-day event
    const dStart = toDateOnly(start);
    const endIso = end || start;
    const dEndExclusive = toDateOnly(
      new Date(new Date(endIso).getTime() + 24 * 60 * 60 * 1000)
    );

    googleDates = `${dStart}/${dEndExclusive}`;

    ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//eos archive//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART;VALUE=DATE:${dStart}`,
      `DTEND;VALUE=DATE:${dEndExclusive}`,
      `SUMMARY:${escapeICS(title)}`,
      description ? `DESCRIPTION:${escapeICS(description)}` : null,
      location ? `LOCATION:${escapeICS(location)}` : null,
      url ? `URL:${escapeICS(url)}` : null,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: googleDates,
    ctz: 'Europe/Berlin', // ensure Google renders in local tz
  });
  if (description) params.set('details', description);
  if (location) params.set('location', location);
  if (url) params.set('sprop', url);

  const googleUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
  return { googleUrl, icsText: ics };
}
