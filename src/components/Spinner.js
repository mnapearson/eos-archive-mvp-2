'use client';

import Image from 'next/image';

export default function Spinner({ fullscreen = true, size = 64 }) {
  if (!fullscreen) {
    const inlineSize = Number(size) || 48;
    return (
      <div className='flex flex-col items-center justify-center gap-3 py-10'>
        <div
          className='animate-spin rounded-full border-2 border-[var(--foreground)]/20 border-t-[var(--foreground)]'
          style={{ width: inlineSize, height: inlineSize }}
        />
        <span className='text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/50'>
          Loading…
        </span>
      </div>
    );
  }

  const logoSize = (Number(size) || 64) * 3.5;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-md'>
      <div className='animate-spin'>
        <Image
          src='https://mqtcodpajykyvodmahlt.supabase.co/storage/v1/object/public/assets/eos25-1.0.png'
          alt='Loading'
          width={logoSize}
          height={logoSize}
          priority
          style={{ width: logoSize, height: logoSize }}
        />
      </div>
    </div>
  );
}
