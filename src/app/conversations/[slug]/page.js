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

export default async function ConversationPublicPage(props) {
  const { slug } = await props.params; // Next 14/15 quirk
  const cookieStore = await cookies(); // await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title, dek, published_at, status')
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
      {/* Header */}
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
        </div>
      </section>

      {/* Body */}
      <section className='px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8'>
        <article
          className='
            max-w-3xl mx-auto
            prose prose-invert
            prose-headings:font-semibold
            prose-h2:mt-6 prose-h3:mt-5 prose-h2:text-xl prose-h3:text-lg
            prose-p:leading-relaxed prose-p:my-4
            prose-li:my-1
            prose-a:underline
            prose-hr:border-white/10
            prose-pre:border prose-pre:rounded-xl
          '>
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
