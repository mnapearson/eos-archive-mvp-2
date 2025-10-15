export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import EAImage from '@/components/EAImage';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/date';

function sanitizeCopy(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function formatQuote(text) {
  if (!text) return '';
  return /^[“"']/.test(text) ? text : `“${text}”`;
}

function toTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  const ts = date.getTime();
  return Number.isNaN(ts) ? null : ts;
}

export default async function ConversationsIndex() {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      'id, slug, title, dek, quote, convo_date, location, cover_image_url, show_cover, published_at, status'
    )
    .eq('status', 'published');

  if (error) {
    console.error('Failed to load conversations', error);
  }

  const rows = (data || [])
    .slice()
    .sort((a, b) => {
      const aConvo = toTimestamp(a?.convo_date);
      const bConvo = toTimestamp(b?.convo_date);
      if (aConvo !== bConvo) {
        const aScore = aConvo ?? Number.NEGATIVE_INFINITY;
        const bScore = bConvo ?? Number.NEGATIVE_INFINITY;
        return bScore - aScore;
      }

      const aPublished = toTimestamp(a?.published_at);
      const bPublished = toTimestamp(b?.published_at);
      if (aPublished !== bPublished) {
        const aScore = aPublished ?? Number.NEGATIVE_INFINITY;
        const bScore = bPublished ?? Number.NEGATIVE_INFINITY;
        return bScore - aScore;
      }

      return (b?.id || 0) - (a?.id || 0);
    })
    .map((row, index) => ({
      ...row,
      conversationNumber: String(index + 1).padStart(2, '0'),
    }));

  return (
    <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
      <header className='space-y-4'>
        <span className='ea-label ea-label--muted'>Conversations</span>
        <h1 className='quick-view__title text-balance'>
          Voices shaping the archive
        </h1>
        <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
          These dialogues highlight unique perspectives that shape event culture
          in Leipzig, Berlin, and beyond.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className='text-sm italic text-[var(--foreground)]/60'>
          No conversations published yet.
        </p>
      ) : (
        <section className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
          {rows.map((row) => {
            const summary =
              sanitizeCopy(row.dek) ||
              sanitizeCopy(row.quote) ||
              sanitizeCopy(row.title);
            const quote = sanitizeCopy(row.quote);
            const title = sanitizeCopy(row.title);
            const showSummary = summary && summary !== title;
            const dateLabel = row.convo_date ? formatDate(row.convo_date) : '';
            const meta = [dateLabel, row.location].filter(Boolean).join(' · ');
            const altText = summary || 'Conversation cover';
            const formattedQuote =
              quote && quote !== summary ? formatQuote(quote) : null;

            return (
              <Link
                key={row.slug}
                href={`/conversations/${row.slug}`}
                className='group relative flex h-full flex-col items-center overflow-hidden rounded-[28px] border border-[var(--foreground)]/12 bg-[var(--background)]/80 p-5 text-center shadow-[0_22px_60px_rgba(0,0,0,0.10)] transition duration-300 hover:-translate-y-1 hover:border-[var(--foreground)]/30 hover:shadow-[0_28px_90px_rgba(0,0,0,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/40'>
                {row.cover_image_url && row.show_cover && (
                  <div className='relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--foreground)]/12 bg-[var(--foreground)]/5'>
                    <EAImage
                      src={row.cover_image_url}
                      alt={altText}
                      fill
                      className='h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]'
                    />
                  </div>
                )}

                <div className='flex flex-col items-center gap-1 text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/55'>
                  <span className='text-xs text-[var(--foreground)]/60'>
                    {title}
                  </span>
                </div>

                <div className='mt-4 flex flex-col items-center gap-3'>
                  {title ? (
                    <h2 className='text-xl font-semibold leading-tight text-[var(--foreground)]'>
                      {summary}
                    </h2>
                  ) : null}
                  {showSummary ? (
                    <p className='text-sm leading-relaxed text-[var(--foreground)]/75 line-clamp-3'>
                      {' '}
                      {meta}{' '}
                    </p>
                  ) : null}
                </div>

                {formattedQuote ? (
                  <p className='mt-4 text-sm italic text-[var(--foreground)]/65 line-clamp-4'>
                    {formattedQuote}
                  </p>
                ) : null}

                <div className='mt-auto flex w-full justify-center pt-6'>
                  <span className='inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-[var(--foreground)]/70 transition duration-200 group-hover:text-[var(--foreground)]'>
                    Read conversation
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
