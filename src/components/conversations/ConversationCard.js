'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function ConversationCard({ convo }) {
  const { slug, title, dek, cover_image_url, published_at } = convo;

  // Safe, stable date format (no locale mismatch)
  const dateStr = published_at
    ? new Date(published_at).toISOString().slice(0, 10)
    : null;

  return (
    <Link
      href={`/conversations/${slug}`}
      className='group relative overflow-hidden rounded-2xl border bg-[var(--background)]/60 hover:bg-[var(--background)] transition-colors'>
      <div className='aspect-[16/10] relative'>
        {cover_image_url ? (
          <Image
            src={cover_image_url}
            alt=''
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='object-cover'
            priority={false}
          />
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-purple-600/30 to-fuchsia-600/30' />
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity' />
      </div>

      <div className='p-3 sm:p-4'>
        {dateStr && (
          <div className='text-[10px] tracking-wide uppercase opacity-60 mb-1'>
            {dateStr}
          </div>
        )}
        <h3 className='text-base sm:text-lg font-semibold leading-snug'>
          {title}
        </h3>
        {dek && <p className='mt-1 line-clamp-2 text-sm opacity-80'>{dek}</p>}
      </div>

      <div className='pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl' />
    </Link>
  );
}
