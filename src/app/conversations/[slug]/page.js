// src/app/conversations/[slug]/page.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Turn single newlines into paragraph breaks, but skip lists/quotes/headings/tables/code fences.
function normalizeMdParagraphs(md) {
  if (!md) return '';
  let text = md.replace(/\r\n/g, '\n');
  const parts = text.split(/```/); // avoid touching fenced code blocks
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(
      /([^\n])\n(?=(?!\n)(?!\s*[-*+]\s)(?!\s*\d+\.\s)(?!\s*>)(?!\s*#{1,6}\s)(?!\s*\|))/g,
      '$1\n\n'
    );
  }
  return parts.join('```');
}

function mdToSafeHtml(md) {
  const normalized = normalizeMdParagraphs(md || '');
  const raw = marked.parse(normalized, { gfm: true, breaks: false });
  return sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'figure',
      'figcaption',
      'h1',
      'h2',
      'h3',
      'pre',
      'code',
    ]),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class', 'id'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'nofollow noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}
const safeHtml = (html) => sanitizeHtml(html || '');

function looksLikeHtml(s = '') {
  // naive tag check; true if it seems to contain any HTML tag
  return /<\s*([a-zA-Z]+)(\s|>)/.test(s);
}

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

export default async function ConversationPublicPage(props) {
  const { slug } = await props.params; // Next 14/15 quirk
  const cookieStore = await cookies(); // await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: conv } = await supabase
    .from('conversations')
    .select(
      'id, title, dek, cover_image_url, published_at, status, convo_date, location, instagram_url, website_url'
    )
    .eq('slug', slug)
    .single();

  if (!conv) return <main className='p-4'>Not found.</main>;

  // Derive conversation number by rank (newest first = 01)
  let convoNumber = null;
  if (conv?.published_at) {
    const { count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', conv.published_at);
    if (typeof count === 'number') {
      convoNumber = String(count).padStart(2, '0');
    }
  }

  const { data: items } = await supabase
    .from('conversation_items')
    .select('id, idx, text_md, html')
    .eq('conversation_id', conv.id)
    .order('idx', { ascending: true });

  return (
    <main className='pb-12'>
      {/* Header */}
      <section className='px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8'>
        <div className='max-w-3xl mx-auto text-center'>
          {/* Optional cover image */}
          {conv.cover_image_url ? (
            <img
              src={conv.cover_image_url}
              alt={
                (conv.dek && conv.dek.replace(/\n/g, ' ')) ||
                conv.title ||
                'Conversation cover'
              }
              loading='lazy'
              className='mx-auto mb-4 w-full max-w-[720px] aspect-[4/3] object-cover'
            />
          ) : null}

          {/* Kicker */}
          <div className='ea-kicker underline decoration-[var(--foreground)]/70 underline-offset-4'>
            <Link href='/conversations'>conversations</Link>
          </div>

          {/* Title from dek (fallback to title) — app-wide text-sm */}
          <h1 className='mt-2 text-lg font-medium tracking-tight'>
            {(conv.dek && conv.dek.replace(/\n/g, ' ')) || conv.title}
          </h1>
          {/* Guest links: Instagram / Website */}
          {(conv.instagram_url || conv.website_url) && (
            <div className='mt-1 text-sm opacity-80'>
              {conv.instagram_url && (
                <a
                  href={conv.instagram_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className=' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded'>
                  Instagram
                </a>
              )}
              {conv.instagram_url && conv.website_url ? ' · ' : null}
              {conv.website_url && (
                <a
                  href={conv.website_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className=' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded'>
                  Website
                </a>
              )}
            </div>
          )}

          {/* Meta: date · location */}
          {(conv.convo_date || conv.location) && (
            <div className='mt-2 text-sm opacity-80'>
              {conv.convo_date ? formatDateDMY(conv.convo_date) : ''}
              {conv.convo_date && conv.location ? ' · ' : ''}
              {conv.location || ''}
            </div>
          )}

          <div className='ea-rule'></div>
        </div>
      </section>

      {/* Body */}
      <section className='px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8'>
        <article className='ea-prose mx-auto'>
          {(items || []).map((it) => {
            const source = it.text_md ?? it.html ?? '';
            const rendered = it.text_md
              ? mdToSafeHtml(source) // native markdown -> paragraphs ok
              : looksLikeHtml(source)
              ? safeHtml(source) // real HTML -> sanitize only
              : mdToSafeHtml(source); // plain text in `html` -> treat as markdown
            return (
              <div
                key={it.id}
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            );
          })}
        </article>
      </section>
    </main>
  );
}
