// Chrome dot + "eos archive" — the same motif already established on
// mobile (components/LoadingScreen.tsx), just static instead of pulsing.
// This was missing from the web app's nav entirely.
export default function Wordmark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className='h-1.5 w-1.5 flex-shrink-0 rounded-full'
        style={{ background: 'var(--chrome)', boxShadow: '0 0 8px var(--chrome-glow)' }}
      />
      <span className='text-[13px] font-medium text-[var(--foreground)]'>eos archive</span>
    </span>
  );
}
