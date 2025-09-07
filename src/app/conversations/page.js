export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function ConversationsIndex() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data } = await supabase
    .from('conversations')
    .select('slug, title, dek, published_at, status')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const rows = data || [];

  return (
    <main className='px-4 py-6 sm:px-6 lg:px-8'>
      <header className='mb-6 sm:mb-8'>
        <div className='text-[11px] tracking-wide uppercase opacity-60'>
          CONVERSATIONS
        </div>
        <p className='mt-2 max-w-2xl text-sm italic opacity-80'>
          Through these dialogues, we celebrate creativity, share stories, and
          highlight the unique voices that shape the event culture in Leipzig
          and beyond.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className='opacity-70'>No conversations published yet.</p>
      ) : (
        <div className='grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
          {rows.map((c) => {
            return (
              <Link
                key={c.slug}
                href={`/conversations/${c.slug}`}
                className='group relative block overflow-hidden rounded-md border border-white/10 bg-[var(--background)] transition-colors hover:border-white/20'>
                <div className='p-3 sm:p-4'>
                  <h3 className='text-base font-semibold leading-snug sm:text-lg'>
                    {c.title}
                  </h3>

                  {/* hairline divider */}
                  <div className='my-3 h-px bg-white/10' />

                  {c.dek ? (
                    <p className='text-sm sm:text-base leading-snug opacity-85'>
                      {c.dek}
                    </p>
                  ) : (
                    <p className='text-sm opacity-60'>Open conversation →</p>
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
