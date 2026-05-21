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
