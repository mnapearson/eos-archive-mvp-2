// Small inline icons shared by every full-bleed hero/card (EventFeedCard,
// SpaceListItem's detail hero, the event detail page) instead of each one
// redefining its own copy.
export function ShareIcon() {
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

export function HeartIcon({ filled = false }) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill={filled ? 'var(--chrome)' : 'none'}
      stroke={filled ? 'var(--chrome)' : 'currentColor'}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'>
      <path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z' />
    </svg>
  );
}
