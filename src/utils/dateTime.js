import { DateTime } from 'luxon';

// Format the date/time: "DD.MM.YY @ HH.MM"
export function formatDateTime(dateString, timeString) {
  if (!dateString) return '';
  const dateObj = new DateTime(dateString).toFormat('dd.MM.yy');
  if (!timeString) return dateObj;
    const segments = timeString.split(':');
    
  return `${dateObj} @ ${segments[0]}.${segments[1]}`;
}