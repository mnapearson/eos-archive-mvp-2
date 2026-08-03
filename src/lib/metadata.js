// src/lib/metadata.js
import { SITE } from '@/lib/seo';

const baseUrl = SITE.url;

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
  const image = event.image_url || SITE.ogImage;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      url: `${baseUrl}/events/${event.id}`,
      images: [
        {
          url: image,
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
      images: [image],
    },
  };
}

/**
 * Build Next.js metadata object for a space, including Open Graph and Twitter Card.
 * @param {object} space  The space record, must include id, name, city, description, image_url/hero_image_url
 * @returns {object}      Metadata config for Next.js
 */
export function buildSpaceMetadata(space) {
  const city = space.city_name || space.city || '';
  const title = city ? `${space.name} · ${city}` : space.name;
  const description = space.description
    ? space.description.slice(0, 160)
    : `${space.type || space.category || ''} · ${SITE.name}`.trim();
  const image = space.hero_image_url || space.image_url || SITE.ogImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/spaces/${space.id}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
