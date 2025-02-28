'use client';

import Image from 'next/image';

export default function Spinner() {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-md'>
      <div className='animate-spin border-[var(--foreground)]'>
        {' '}
        <Image
          src='https://mqtcodpajykyvodmahlt.supabase.co/storage/v1/object/public/assets/EOS24_metal_blue_transparent.png'
          alt='eos archive logo'
          width={300}
          height={600}
          priority
        />
      </div>
    </div>
  );
}
