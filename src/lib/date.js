// src/lib/date.js
import { format, parseISO } from 'date-fns';

const DATE_FMT = 'd MMM yyyy';
const TIME_FMT = 'HH:mm';

export function formatDate(dateISO) {
  if (!dateISO) return '';
  try {
    return format(parseISO(dateISO), DATE_FMT);
  } catch {
    return '';
  }
}

export function formatTime(timeISO) {
  if (!timeISO) return '';
  try {
    return format(parseISO(`1970-01-01T${timeISO}`), TIME_FMT);
  } catch {
    return '';
  }
}

// Matches eos-archive-app/app/space/[id].tsx's formatRelativeTime exactly,
// for the ported space notes section.
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths <= 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

export function formatDateRange(start, end, startTime, endTime) {
  const d1 = formatDate(start);
  const d2 = end && end !== start ? formatDate(end) : null;

  const t1 = startTime ? formatTime(startTime) : null;
  const t2 = endTime && endTime !== startTime ? formatTime(endTime) : null;

  let range = d2 ? `${d1} – ${d2}` : d1;
  if (t1) {
    range += ` @ ${t1}`;
    if (t2) range += ` – ${t2}`;
  }
  return range;
}
