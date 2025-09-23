'use client';
import EAImage from '@/components/EAImage';

// Format a date/time string into "DD Mon YYYY, HH:MM" or a range if end exists.
function formatDateTimeRange(evt) {
  const start = evt?.start_datetime || evt?.start_time || evt?.start;
  const end = evt?.end_datetime || evt?.end_time || evt?.end;
  if (!start) return '';

  const toParts = (val) => {
    if (!val) return {};
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    if (typeof val === 'string') {
      const [datePart, timePart] = val.split('T');
      if (datePart && /\d{4}-\d{2}-\d{2}/.test(datePart)) {
        const [y, m, d] = datePart.split('-');
        const day = d.padStart(2, '0');
        const mon = months[parseInt(m, 10) - 1] || '';
        let time = '';
        if (timePart) {
          const [hh, mm] = timePart.split(':');
          time = `${hh?.padStart(2, '0') || '00'}:${
            mm?.padStart(2, '0') || '00'
          }`;
        }
        return { date: `${day} ${mon} ${y}`, time };
      }
    }
    // Fallback: Date parsing if format was unexpected
    const d = new Date(val);
    if (isNaN(d)) return {};
    const dd = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return { date: `${dd} ${mon} ${yyyy}`, time: `${hh}:${mm}` };
  };

  const S = toParts(start);
  if (!end) return S.time ? `${S.date}, ${S.time}` : S.date || '';
  const E = toParts(end);
  const sameDay = S.date && E.date && S.date === E.date;
  if (sameDay)
    return `${S.date}${S.time ? `, ${S.time}` : ''}${
      E.time ? ` — ${E.time}` : ''
    }`;
  return `${S.date}${S.time ? `, ${S.time}` : ''} → ${E.date}${
    E.time ? `, ${E.time}` : ''
  }`;
}

export default function EventQuickView({ event }) {
  const title = event?.title || 'Event';
  const img =
    event?.flyer_url || event?.image_url || event?.thumbnail_url || null;
  const venue = event?.space_name || event?.venue || '';
  const address = event?.address || event?.space_address || '';
  const city = event?.city || event?.space_city || '';
  const when = formatDateTimeRange(event);
  const gmaps =
    address || city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${address ? address + ', ' : ''}${city}`
        )}`
      : null;
  const eventHref = `/events/${event?.slug || event?.id || ''}`;

  return (
    <div className='text-sm'>
      {/* Title */}
      <h2 className='text-base font-medium tracking-tight'>{title}</h2>

      {/* Meta line: date/time · venue */}
      {(when || venue || city) && (
        <div className='mt-1 opacity-80'>
          {when}
          {when && (venue || city) ? ' · ' : ''}
          {[venue, city].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Flyer image */}
      {img && (
        <div className='mt-3 relative w-full'>
          <EAImage
            src={img}
            alt={title}
            width={720}
            height={960} // portrait 3:4
            sizes='(min-width: 768px) 720px, 92vw'
            className='w-full h-auto rounded-md object-cover'
          />
        </div>
      )}

      {/* Address */}
      {(address || city) && (
        <div className='mt-3'>
          <span className='opacity-70'>Address: </span>
          {gmaps ? (
            <a
              href={gmaps}
              target='_blank'
              rel='noopener noreferrer'
              className='underline focus-visible:ring-2 focus-visible:ring-white/30 rounded'>
              {address || city}
            </a>
          ) : (
            <span>{address || city}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className='mt-4 flex flex-wrap items-center gap-2'>
        <a
          href={eventHref}
          className='button'>
          Open event page
        </a>
      </div>
    </div>
  );
}
