'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import EAImage from '@/components/EAImage';
import { formatDateRange } from '@/lib/date';

const ROTATE_STEP = 16;
const TRANSLATE_X_STEP = 240;
const TRANSLATE_Z_STEP = 90;
const MAX_OFFSET = 4;
const WHEEL_THRESHOLD = 120;
const WHEEL_COOLDOWN = 200;
const SWIPE_THRESHOLD = 80;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
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

function getEventStatusLabel(event) {
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

  return 'Past';
}

function buildDescriptionExcerpt(description, maxLength = 160) {
  if (!description) return '';
  const trimmed = description.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).replace(/\s+$/, '')}…`;
}

export default function CoverFlowGallery({
  items = [],
  initialIndex = 0,
  onSelect,
}) {
  const [activeIndex, setActiveIndex] = useState(() =>
    clamp(initialIndex, 0, Math.max(items.length - 1, 0))
  );
  const wheelStateRef = useRef({ delta: 0, lastGesture: 0 });
  const dragStateRef = useRef({
    dragging: false,
    startX: 0,
    delta: 0,
    pointerId: null,
    pointerType: 'mouse',
  });
  const skipClickRef = useRef(false);
  const skipClickTimeoutRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setActiveIndex((prev) => {
      const nextIndex = clamp(initialIndex, 0, Math.max(items.length - 1, 0));
      return prev === nextIndex ? prev : nextIndex;
    });
    dragStateRef.current = {
      dragging: false,
      startX: 0,
      delta: 0,
      pointerId: null,
      pointerType: 'mouse',
    };
    setDragOffset(0);
    setIsDragging(false);
  }, [initialIndex, items.length]);

  useEffect(() => {
    return () => {
      if (skipClickTimeoutRef.current) {
        clearTimeout(skipClickTimeoutRef.current);
      }
    };
  }, []);

  const move = useCallback(
    (delta) => {
      setActiveIndex((prev) => clamp(prev + delta, 0, items.length - 1));
    },
    [items.length]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        move(1);
      } else if (
        (event.key === 'Enter' || event.key === ' ') &&
        items[activeIndex]
      ) {
        event.preventDefault();
        onSelect?.(items[activeIndex]);
      }
    },
    [activeIndex, items, move, onSelect]
  );

  const handleWheel = useCallback(
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

      const horizontalDelta = event.deltaX;
      if (!Number.isFinite(horizontalDelta)) return;

      const deltaMagnitude = Math.abs(horizontalDelta);
      if (deltaMagnitude < 1.2) return;

      const state = wheelStateRef.current;
      const now = Date.now();
      state.delta += horizontalDelta;
      event.preventDefault();

      if (
        Math.abs(state.delta) >= WHEEL_THRESHOLD &&
        now - state.lastGesture > WHEEL_COOLDOWN
      ) {
        move(state.delta > 0 ? 1 : -1);
        state.delta = 0;
        state.lastGesture = now;
      } else if (Math.abs(state.delta) >= WHEEL_THRESHOLD) {
        // retain some remainder to avoid locking when within cooldown
        state.delta = Math.sign(state.delta) * (Math.abs(state.delta) % WHEEL_THRESHOLD);
      }
    },
    [move]
  );

  const handlePointerDown = useCallback((event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target?.closest('.cover-flow__card-actions')) return;

    dragStateRef.current.dragging = true;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.delta = 0;
    dragStateRef.current.pointerId = event.pointerId ?? null;
    dragStateRef.current.pointerType = event.pointerType;
    setIsDragging(true);
    setDragOffset(0);
    skipClickRef.current = false;

    if (event.currentTarget.setPointerCapture && event.pointerId != null) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore if the browser disallows capture
      }
    }
  }, []);

  const handlePointerMove = useCallback((event) => {
    const state = dragStateRef.current;
    if (!state.dragging) return;
    if (state.pointerId != null && event.pointerId !== state.pointerId) return;

    const delta = event.clientX - state.startX;
    state.delta = delta;
    setDragOffset(delta);
  }, []);

  const endPointerGesture = useCallback(
    (event) => {
      const state = dragStateRef.current;
      if (!state.dragging) return;
      if (state.pointerId != null && event.pointerId !== state.pointerId) return;

      const didSwipe = Math.abs(state.delta) >= SWIPE_THRESHOLD;
      if (didSwipe) {
        move(state.delta < 0 ? 1 : -1);
        skipClickRef.current = true;
        if (skipClickTimeoutRef.current) {
          clearTimeout(skipClickTimeoutRef.current);
        }
        skipClickTimeoutRef.current = window.setTimeout(() => {
          skipClickRef.current = false;
          skipClickTimeoutRef.current = null;
        }, 240);
      }

      if (event?.currentTarget?.releasePointerCapture && state.pointerId != null) {
        try {
          event.currentTarget.releasePointerCapture(state.pointerId);
        } catch {
          // ignore release failures
        }
      }

      dragStateRef.current = {
        dragging: false,
        startX: 0,
        delta: 0,
        pointerId: null,
        pointerType: 'mouse',
      };

      setDragOffset(0);
      setIsDragging(false);
    },
    [move]
  );

  if (!items.length) {
    return (
      <div className='cover-flow__empty text-center text-sm opacity-70'>
        No events found.
      </div>
    );
  }

  const dragProgress = dragOffset / TRANSLATE_X_STEP;

  return (
    <div
      className='cover-flow'
      aria-live='polite'
      data-dragging={isDragging ? 'true' : 'false'}>
      <div className='cover-flow__stage-wrapper'>
        <div
          className='cover-flow__stage'
          tabIndex={0}
          role='listbox'
          aria-label='Event cover flow'
          aria-activedescendant={
            items[activeIndex]
              ? `cover-flow-item-${items[activeIndex].id ?? activeIndex}`
              : undefined
          }
          data-dragging={isDragging ? 'true' : 'false'}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointerGesture}
          onPointerCancel={endPointerGesture}>
          <ul className='cover-flow__track'>
            {items.map((event, index) => {
              const rawOffset = index - activeIndex + dragProgress;
              const clampedOffset = Math.max(
                -MAX_OFFSET,
                Math.min(rawOffset, MAX_OFFSET)
              );
              const absOffset = Math.abs(clampedOffset);
              const translateX = clampedOffset * TRANSLATE_X_STEP;
              const translateZ = -Math.pow(absOffset, 1.2) * TRANSLATE_Z_STEP;
              const rotateY = clampedOffset * -ROTATE_STEP;
              const opacity = Math.max(0, 1 - absOffset * 0.18);
              const zIndex = items.length - Math.round(absOffset * 10);
              const isActive = index === activeIndex;

              const dateLabel = formatDateRange(
                event?.start_date,
                event?.end_date,
                event?.start_time,
                event?.end_time
              );
              const city = event?.space_city || event?.city;
              const venue = event?.space_name || event?.venue;
              const meta = [dateLabel, city, venue].filter(Boolean);
              const statusLabel = getEventStatusLabel(event);
              const excerpt = buildDescriptionExcerpt(event?.description);
              const href = event?.slug
                ? `/events/${event.slug}`
                : event?.id
                ? `/events/${event.id}`
                : '#';

              return (
                <li
                  key={event.id ?? index}
                  id={`cover-flow-item-${event.id ?? index}`}
                  role='option'
                  aria-selected={isActive}
                  className='cover-flow__item'
                  style={{
                    transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                    zIndex,
                    opacity,
                    transition: isDragging ? 'none' : undefined,
                  }}>
                  <div
                    className={`cover-flow__card-shell${
                      isActive ? ' is-active' : ''
                    }`}>
                    <button
                      type='button'
                      className={`cover-flow__card${
                        isActive ? ' is-active' : ''
                      }`}
                      onClick={() => {
                        if (skipClickRef.current) return;
                        if (isActive) {
                          onSelect?.(event);
                        } else {
                          setActiveIndex(index);
                        }
                      }}>
                      <span className='sr-only'>
                        {isActive
                          ? `Open quick view for ${event?.title || 'event'}`
                          : `Focus ${event?.title || 'event'}`}
                      </span>
                      <div className='cover-flow__art'>
                        <EAImage
                          src={event?.image_url || '/placeholder.jpg'}
                          alt={event?.title || 'Event artwork'}
                          fill
                          sizes='(max-width: 768px) 70vw, (max-width: 1024px) 40vw, 320px'
                          className='cover-flow__image'
                        />
                      </div>
                      <div className='cover-flow__info'>
                        <div className='cover-flow__labels'>
                          {statusLabel && (
                            <span className='cover-flow__badge'>
                              {statusLabel}
                            </span>
                          )}
                          {event?.category && (
                            <span className='cover-flow__tag'>
                              {event.category}
                            </span>
                          )}
                        </div>
                        <h3 className='cover-flow__title'>
                          {event?.title || 'Untitled event'}
                        </h3>
                        {meta.length > 0 && (
                          <div className='cover-flow__meta'>
                            {meta.map((detail, metaIndex) => (
                              <span
                                key={`${event.id ?? index}-meta-${metaIndex}`}
                                className='cover-flow__meta-chip'>
                                {detail}
                              </span>
                            ))}
                          </div>
                        )}
                        {excerpt && (
                          <p className='cover-flow__excerpt'>{excerpt}</p>
                        )}
                      </div>
                    </button>
                    {isActive && (
                      <div className='cover-flow__card-actions'>
                        <Link
                          href={href}
                          className='nav-action cover-flow__action-btn'>
                          View full event
                        </Link>
                        <button
                          type='button'
                          className='nav-action cover-flow__action-btn'
                          onClick={() => onSelect?.(event)}>
                          Quick view
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className='cover-flow__controls'>
        <button
          type='button'
          className='nav-action cover-flow__control'
          onClick={() => move(-1)}
          disabled={activeIndex === 0}>
          ←<span className='sr-only'>Previous event</span>
        </button>
        <button
          type='button'
          className='nav-action cover-flow__control'
          onClick={() => move(1)}
          disabled={activeIndex === items.length - 1}>
          →<span className='sr-only'>Next event</span>
        </button>
      </div>
    </div>
  );
}
