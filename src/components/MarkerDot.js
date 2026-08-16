'use client';

// Ported from eos-archive-app/components/MarkerDot.tsx — same two-layer
// approach (an animated/ringed underlay plus a static solid dot on top) so
// the pulse (event today/tomorrow) and ring (event within 7 days) treatment
// can't drift between mobile and web.
export default function MarkerDot({ state = 'default', color, dotSize = 8, ringSize = 16 }) {
  const containerSize = Math.max(dotSize, ringSize);

  return (
    <span
      className='relative inline-flex flex-shrink-0 items-center justify-center'
      style={{ width: containerSize, height: containerSize }}>
      {state === 'live' && (
        <span
          className='absolute rounded-full'
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            animation: 'marker-pulse 1400ms ease-out infinite',
          }}
        />
      )}
      {state === 'soon' && (
        <span
          className='absolute rounded-full'
          style={{
            width: ringSize,
            height: ringSize,
            border: '1.5px solid var(--silver)',
            backgroundColor: 'transparent',
          }}
        />
      )}
      <span
        className='relative rounded-full'
        style={{ width: dotSize, height: dotSize, backgroundColor: color }}
      />
    </span>
  );
}
