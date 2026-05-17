export const EVENT_CATEGORIES = [
  'exhibition',
  'opening',
  'closing',
  'concert',
  'live music',
  'dj night',
  'day party',
  'festival',
  'performance',
  'workshop',
  'market',
  'film',
  'talk',
  'community',
  'other',
];

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_MAX_SIZE_MB = 5;
export const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;
export const FLYER_MAX_SIZE_MB = 5;
export const FLYER_MAX_SIZE_BYTES = FLYER_MAX_SIZE_MB * 1024 * 1024;
export const DOCUMENT_MAX_SIZE_MB = 10;
export const DOCUMENT_MAX_SIZE_BYTES = DOCUMENT_MAX_SIZE_MB * 1024 * 1024;

export const baseInputClasses =
  'input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25';
export const textAreaClasses = `${baseInputClasses} min-h-[140px]`;
export const helperTextClasses = 'text-xs leading-relaxed text-[var(--foreground)]/60';
export const dropzoneClasses =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--foreground)]/28 bg-[var(--background)]/70 px-4 py-10 text-center transition hover:border-[var(--foreground)]/45 hover:bg-[var(--background)]/80';
export const actionButtonClasses =
  'nav-action !inline-flex h-11 items-center justify-center px-8 text-[11px] uppercase tracking-[0.28em]';
export const primaryActionClasses = `${actionButtonClasses} nav-cta shadow-[0_18px_48px_rgba(0,0,0,0.28)]`;
export const subtleActionClasses = `${actionButtonClasses} hover:border-[var(--foreground)]/35`;
export const dangerActionClasses = `${actionButtonClasses} border border-red-500 text-red-400 shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:bg-red-500/10`;
export const statusBadgeClasses =
  'inline-flex items-center gap-2 rounded-full border border-[var(--foreground)]/14 bg-[var(--background)]/80 px-3 py-1 text-[10px] uppercase tracking-[0.28em]';
