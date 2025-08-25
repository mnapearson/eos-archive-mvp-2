// src/components/AddToCalendar.js
'use client';

import { useMemo, useCallback } from 'react';
import { buildCalendarArtifacts } from '@/lib/calendarLinks';

export default function AddToCalendar({
  event,
  className = '',
  overrides = {},
}) {
  const { googleUrl, icsText } = useMemo(
    () => buildCalendarArtifacts(event, overrides),
    [event, overrides]
  );

  const handleDownloadICS = useCallback(() => {
    if (!icsText) return;
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeTitle = (event?.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle || 'event'}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [icsText, event?.title]);

  if (!event?.start_date) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {googleUrl && (
        <a
          href={googleUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='button'>
          Add to G-Cal
        </a>
      )}
      {icsText && (
        <button
          onClick={handleDownloadICS}
          className='button'>
          Download .ics
        </button>
      )}
    </div>
  );
}
