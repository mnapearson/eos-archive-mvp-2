export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

function mdToSafeHtml(md) {
  const raw = marked.parse(md || '', { breaks: true });
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
function safeHtml(html) {
  return sanitizeHtml(html || '');
}

export default async function ConversationPublicPage(props) {
  // Next 14/15 may pass params as a promise
  const { slug } = await props.params;

  const supabase = createServerComponentClient({ cookies });

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title, dek, cover_image_url, published_at, status')
    .eq('slug', slug)
    .single();

  if (!conv) return <main className='p-4'>Not found.</main>;

  const { data: items } = await supabase
    .from('conversation_items')
    .select('id, idx, text_md, html')
    .eq('conversation_id', conv.id)
    .order('idx', { ascending: true });

  const dateStr = conv.published_at
    ? new Date(conv.published_at).toISOString().slice(0, 10)
    : null;

  return (
    <main className='pb-12'>
      {/* Hero */}
      <section className='px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-[11px] tracking-wide uppercase opacity-60'>
            <Link
              href='/conversations'
              className='underline'>
              Conversations
            </Link>
            {dateStr ? <span className='mx-2 opacity-50'>/</span> : null}
            {dateStr ? <span>{dateStr}</span> : null}
          </div>

          <h1 className='mt-2 text-2xl sm:text-3xl font-semibold leading-tight'>
            {conv.title}
          </h1>

          {conv.dek && <p className='mt-2 text-base opacity-80'>{conv.dek}</p>}

          {conv.cover_image_url && (
            <div className='mt-4 overflow-hidden rounded-2xl border bg-[var(--background)]/60'>
              {/* Using regular img here to avoid extra imports; swap to Next/Image if you prefer */}
              <img
                src={conv.cover_image_url}
                alt=''
                className='w-full h-auto object-cover'
              />
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className='px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8'>
        <article
          className='
            max-w-3xl mx-auto
            prose prose-invert
            prose-headings:font-semibold
            prose-h2:text-xl prose-h3:text-lg
            prose-p:leading-relaxed
            prose-a:underline
            prose-img:rounded-xl prose-img:border
            prose-pre:border prose-pre:rounded-xl
          '>
          {(items || []).map((it) => {
            const rendered = it.text_md
              ? mdToSafeHtml(it.text_md)
              : safeHtml(it.html);
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
