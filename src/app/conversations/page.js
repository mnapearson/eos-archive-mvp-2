export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function ConversationsIndex() {
  const supabase = createServerComponentClient({ cookies });

  const { data } = await supabase
    .from('conversations')
    .select('slug, title, dek, cover_image_url, published_at, status')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const rows = data || [];

  return (
    <main className='px-4 py-6 sm:px-6 lg:px-8'>
      <header className='mb-6 sm:mb-8'>
        <div className='text-[11px] tracking-wide uppercase opacity-60'>
          Archive
        </div>
        <h1 className='text-2xl sm:text-3xl font-semibold'>Conversations</h1>
        <p className='mt-2 max-w-2xl text-sm opacity-80'>
          Interviews, notes, and dialogues from the eos community.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className='opacity-70'>No conversations published yet.</p>
      ) : (
        <div className='grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
          {rows.map((c) => {
            const dateStr = c.published_at
              ? new Date(c.published_at).toISOString().slice(0, 10)
              : null;

            return (
              <Link
                key={c.slug}
                href={`/conversations/${c.slug}`}
                className='group relative block overflow-hidden rounded-md border border-white/10 bg-[var(--background)] transition-colors hover:border-white/20'>
                {/* Image header */}
                {c.cover_image_url ? (
                  <div className='h-40 w-full sm:h-48'>
                    <img
                      src={c.cover_image_url}
                      alt=''
                      loading='lazy'
                      className='h-full w-full object-cover'
                    />
                  </div>
                ) : (
                  <div className='h-40 w-full bg-gradient-to-br from-purple-600/30 to-fuchsia-600/30 sm:h-48' />
                )}

                {/* Body */}
                <div className='p-3 sm:p-4'>
                  {dateStr && (
                    <div className='mb-1 text-[10px] uppercase tracking-wide opacity-60'>
                      {dateStr}
                    </div>
                  )}
                  <h3 className='text-base font-semibold leading-snug sm:text-lg'>
                    {c.title}
                  </h3>
                  {c.dek && (
                    <p className='mt-1 line-clamp-2 text-sm opacity-80'>
                      {c.dek}
                    </p>
                  )}
                </div>

                {/* subtle hairline ring */}
                <div className='pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/10' />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
