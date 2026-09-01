'use client';

import Link from 'next/link';
import EventFlyer from '@/components/EventFlyer';
import ShareButton from '@/components/ShareButton';
import { formatDateRange } from '@/lib/date';

// Mirrors eos-archive-app/components/EventCard.tsx: one full-bleed image
// card with a bottom gradient, title/date/venue overlaid on it, and a small
// circular share button — used everywhere an event shows up in a feed
// (home, space detail, admin) instead of each place hand-rolling its own
// card markup.
export default function EventFeedCard({ event, onSelect, className = '' }) {
  const href = event?.id ? `/events/${event.id}` : '#';
  const dateLabel = formatDateRange(
    event?.start_date,
    event?.end_date,
    event?.start_time,
    event?.end_time
  );
  const venue = event?.space_name || event?.venue;
  const statusLabel = getEventStatus(event);
  const shareSummary = [dateLabel, event?.space_city || event?.city, venue]
    .filter(Boolean)
    .join(' · ');

  const handleLinkClick = (clickEvent) => {
    if (typeof onSelect !== 'function') return;
    const nativeButton = clickEvent?.nativeEvent?.button ?? clickEvent?.button;
    if (clickEvent?.metaKey || clickEvent?.ctrlKey || nativeButton === 1) return;
    clickEvent.preventDefault();
    onSelect(event);
  };

  return (
    <div
      className={`event-feed-card group ${className}`.trim()}
      data-testid='event-card'
      data-event-id={event?.id}>
      <Link
        href={href}
        scroll={false}
        className='event-feed-card__link'
        aria-label={event?.title || 'Open event'}
        onClick={handleLinkClick}>
        <EventFlyer
          event={event}
          spaceCategory={event?.space_type}
          alt={event?.title || 'Event image'}
          imgClassName='event-feed-card__image'
          fallbackClassName='absolute inset-0 !h-full !w-full !aspect-auto !rounded-none'
          showText={false}
          imgTestId='event-card-image'
        />
        <div
          className='event-feed-card__gradient'
          aria-hidden='true'
        />
        {statusLabel && (
          <span className='event-feed-card__status'>{statusLabel}</span>
        )}
        <div className='event-feed-card__overlay'>
          <h3 className='event-feed-card__title'>{event?.title}</h3>
          {dateLabel && <p className='event-feed-card__date'>{dateLabel}</p>}
          {venue && <p className='event-feed-card__venue'>{venue}</p>}
        </div>
      </Link>

      <span className='event-feed-card__share-wrap'>
        <ShareButton
          title={event?.title}
          text={shareSummary}
          url={href}
          className='event-feed-card__share'
          copiedText='✓'
          aria-label='Share event'>
          <ShareIcon />
        </ShareButton>
      </span>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'>
      <path d='M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6' />
      <polyline points='16 6 12 2 8 6' />
      <line
        x1='12'
        y1='2'
        x2='12'
        y2='15'
      />
    </svg>
  );
}

function getEventStatus(event) {
  const start = parseDateTime(event?.start_date, event?.start_time, 'start');
  const end = parseDateTime(
    event?.end_date || event?.start_date,
    event?.end_time,
    'end'
  );
  if (!start) return '';

  const now = new Date();
  if (start > now) {
    return 'Upcoming';
  }

  if (end && now <= end) {
    return 'Current';
  }

  if (!end && now.toDateString() === start.toDateString()) {
    return 'Current';
  }

  return '';
}

function parseDateTime(date, time, type) {
  if (!date) return null;
  try {
    const isoTime = time
      ? time.length === 5
        ? `${time}:00`
        : time
      : type === 'end'
      ? '23:59:59'
      : '00:00:00';
    const value = new Date(`${date}T${isoTime}`);
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}
