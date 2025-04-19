// src/lib/metadata.js
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://eosarchivemvp.netlify.app';

/**
 * Format a date/time range as "DD.MM-DD.MM.YY @ HH.MM-HH.MM".
 * If only startDate is provided (no endDate), returns just the single date.
 * @param {string} startDateString
 * @param {string} endDateString
 * @param {string} startTimeString
 * @param {string} endTimeString
 * @returns {string}
 */
export function formatDateRange(
  startDateString,
  endDateString,
  startTimeString,
  endTimeString
) {
  if (!startDateString) return '';
  const s = new Date(startDateString);
  const e = endDateString ? new Date(endDateString) : s;

  const d1 = String(s.getDate()).padStart(2, '0');
  const m1 = String(s.getMonth() + 1).padStart(2, '0');
  const d2 = String(e.getDate()).padStart(2, '0');
  const m2 = String(e.getMonth() + 1).padStart(2, '0');
  const y = String(s.getFullYear()).slice(-2);

  let times = '';
  if (startTimeString && endTimeString) {
    const [h1, min1] = startTimeString.split(':');
    const [h2, min2] = endTimeString.split(':');
    times = ` @ ${h1}.${min1}-${h2}.${min2}`;
  }

  return `${d1}.${m1}-${d2}.${m2}.${y}${times}`;
}

/**
 * Build Next.js metadata object for an event, including Open Graph and Twitter Card.
 * @param {object} event  The event record, must include start_/end_date, start_/end_time, image_url, title, id, and nested space.name
 * @returns {object}      Metadata config for Next.js
 */
export function buildEventMetadata(event) {
  const datePart = formatDateRange(
    event.start_date,
    event.end_date,
    event.start_time,
    event.end_time
  );
  const spaceName = event.space?.name || '';
  const description = datePart ? `${spaceName} · ${datePart}` : `${spaceName}`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      url: `${baseUrl}/events/${event.id}`,
      images: [
        {
          url: event.image_url,
          width: 1200,
          height: 1200,
          alt: `${event.title} flyer`,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [event.image_url],
    },
  };
}
