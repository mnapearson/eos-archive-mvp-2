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
    .select(
      'id, slug, title, dek, quote, convo_date, location, cover_image_url, published_at, status'
    )
    .eq('status', 'published');

  function extractNumberFromTitle(title) {
    const m = String(title || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  const rows = (data || []).slice().sort((a, b) => {
    const an = extractNumberFromTitle(a.title);
    const bn = extractNumberFromTitle(b.title);
    if (an == null && bn == null) return 0;
    if (an == null) return 1;
    if (bn == null) return -1;
    return bn - an; // descending
  });
  const total = rows.length;

  function formatDateDMY(ymd) {
    if (!ymd) return '';
    const [y, m, d] = String(ymd).split('T')[0].split('-');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const day = d.padStart(2, '0');
    const mon = months[parseInt(m, 10) - 1] || '';
    return `${day} ${mon} ${y}`;
  }

  return (
    <main className='px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto'>
        <div className='text-[11px] tracking-wide uppercase opacity-60'>
          Conversations
        </div>
        <p className='mt-2 max-w-2xl text-sm italic opacity-80'>
          Through these dialogues highlight the unique voices that shape the
          independent scene in Leipzig and beyond.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className='opacity-70'>No conversations published yet.</p>
      ) : (
        <div className='my-4 flex flex-wrap gap-4 sm:gap-6 justify-center'>
          {rows.map((c) => {
            const desc = (c.dek && c.dek.replace(/\n/g, ' ')) || c.title || '';
            const dateStr = c.convo_date ? formatDateDMY(c.convo_date) : null;
            return (
              <Link
                key={c.slug}
                href={`/conversations/${c.slug}`}
                aria-label={`Open ${c.title || 'conversation'}`}
                className='border p-3 block h-[17rem] w-[350px] shrink-0'>
                <div className='text-center flex h-full flex-col min-h-[120px]'>
                  {/* Optional cover image (Apartamento style) */}
                  {c.cover_image_url ? (
                    <img
                      src={c.cover_image_url}
                      alt={desc || 'Conversation cover'}
                      loading='lazy'
                      className='mx-auto mb-3 w-full aspect-[4/3] object-cover'
                    />
                  ) : null}

                  {/* Kicker: conversation title as link-style text */}
                  <div className='ea-kicker underline decoration-[var(--foreground)]/70 underline-offset-4'>
                    {c.title}
                  </div>

                  {/* Big line from description (dek); fall back to title */}
                  <h3 className='mt-3 font-medium tracking-tight text-lg line-clamp-2'>
                    {desc}
                  </h3>
                  {/* Meta: date · location */}
                  {(dateStr || c.location) && (
                    <div className='mt-2 ea-meta'>
                      {dateStr}
                      {dateStr && c.location ? ' · ' : ''}
                      {c.location || ''}
                    </div>
                  )}

                  {/* Optional quote */}
                  {c.quote && (
                    <p className='text-justify m-3 italic opacity-85 text-sm line-clamp-5'>
                      {c.quote}
                    </p>
                  )}

                  {/* Spacer to push button down if content is short */}
                  <div className='mt-auto' />

                  {/* Read more button using global .button style */}
                  <div className='mx-auto p-2'>
                    <button className='button mx-auto'>Read more</button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
