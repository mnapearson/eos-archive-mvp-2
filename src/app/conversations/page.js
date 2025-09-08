export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export default async function ConversationsIndex() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data } = await supabase
    .from('conversations')
    .select('id, slug, title, dek, cover_image_url, published_at, status')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const rows = data || [];
  const total = rows.length;

  // --- helpers for preview rendering (markdown -> safe HTML) ---
  function looksLikeHtml(s = '') {
    return /<\s*([a-zA-Z]+)(\s|>)/.test(s);
  }
  function mdToSafeHtml(md) {
    const raw = marked.parse(md || '', { gfm: true, breaks: false });
    return sanitizeHtml(raw, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'h1',
        'h2',
        'h3',
        'pre',
        'code',
        'strong',
        'em',
        'p',
        'ul',
        'ol',
        'li',
        'blockquote',
        'br',
      ]),
      allowedAttributes: { '*': ['class'] },
    });
  }
  const safeHtml = (html) => sanitizeHtml(html || '');

  async function fetchPreviewHTML(conversationId) {
    const { data: item } = await supabase
      .from('conversation_items')
      .select('text_md, html, idx')
      .eq('conversation_id', conversationId)
      .order('idx', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!item) return '';
    const src = item.text_md ?? item.html ?? '';
    if (item.text_md) return mdToSafeHtml(src);
    return looksLikeHtml(src) ? safeHtml(src) : mdToSafeHtml(src);
  }

  const rowsWithPreview = await Promise.all(
    rows.map(async (r) => ({ ...r, previewHtml: await fetchPreviewHTML(r.id) }))
  );

  return (
    <main className='px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto'>
        <div className='text-[11px] tracking-wide uppercase opacity-60'>
          Conversations
        </div>
        <p className='mt-2 max-w-2xl text-sm italic opacity-80'>
          Through these dialogues, we celebrate creativity, share stories, and
          highlight the unique voices that shape independent event culture in
          Leipzig and beyond.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className='opacity-70'>No conversations published yet.</p>
      ) : (
        <div className='my-4 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
          {rowsWithPreview.map((c, idx) => {
            const number = String(total - idx).padStart(2, '0');
            const [m1, m2] = (c.dek || '')
              .split('\n')
              .map((t) => t.trim())
              .filter(Boolean);
            const previewHtml = c.previewHtml || '';
            return (
              <Link
                key={c.slug}
                href={`/conversations/${c.slug}`}
                aria-label={`Open Conversation ${number}${
                  c.title ? `: ${c.title}` : ''
                }`}
                className='block'>
                <div className='text-center'>
                  {/* Optional cover image (Apartamento style) */}
                  {c.cover_image_url ? (
                    <img
                      src={c.cover_image_url}
                      alt={
                        (c.dek && c.dek.replace(/\n/g, ' ')) ||
                        c.title ||
                        'Conversation cover'
                      }
                      loading='lazy'
                      className='mx-auto mb-3 w-full max-w-[640px] aspect-[4/3] object-cover'
                    />
                  ) : null}

                  {/* Kicker: conversation number as link-style text */}
                  <div className='ea-kicker underline decoration-[var(--foreground)]/70 underline-offset-4'>
                    Conversation {number}
                  </div>

                  {/* Big title from description (dek); fall back to title; calmer weight/size */}
                  <h3 className='mt-3 text-sm tracking-tight '>
                    {(c.dek && c.dek.replace(/\n/g, ' ')) || c.title}
                  </h3>

                  {/* Read more button using global .button style */}
                  <div className='mt-5 mx-auto'>
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
