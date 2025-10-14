export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import EAImage from '@/components/EAImage';
import ShareButton from '@/components/ShareButton';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/date';
import {
  markdownToSafeHtml,
  htmlToSafeHtml,
  stringLooksLikeHtml,
} from '@/lib/markdown';
import { SITE } from '@/lib/seo';

function sanitizeCopy(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function buildConversationSummary(conversation) {
  return (
    sanitizeCopy(conversation?.dek) ||
    sanitizeCopy(conversation?.quote) ||
    sanitizeCopy(conversation?.title)
  );
}

function formatQuote(text) {
  if (!text) return '';
  return /^[“"']/.test(text) ? text : `“${text}”`;
}

async function fetchConversation(slug, { silent = false } = {}) {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      'id, slug, title, dek, quote, cover_image_url, show_cover, published_at, status, convo_date, location, instagram_url, website_url'
    )
    .eq('slug', slug)
    .single();

  if (error && !silent) {
    console.error(`Failed to load conversation "${slug}"`, error);
  }

  return data ?? null;
}

async function fetchConversationItems(conversationId) {
  const { data, error } = await supabase
    .from('conversation_items')
    .select('id, idx, text_md, html')
    .eq('conversation_id', conversationId)
    .order('idx', { ascending: true });

  if (error) {
    console.error('Failed to load conversation items', error);
    return [];
  }

  return data ?? [];
}

async function fetchConversationNumber(publishedAt) {
  if (!publishedAt) return null;

  const { count, error } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('published_at', publishedAt);

  if (error) {
    console.error('Failed to compute conversation number', error);
    return null;
  }

  if (typeof count !== 'number') return null;
  return String(count).padStart(2, '0');
}

function buildShareSummary(conversation, meta) {
  return [sanitizeCopy(conversation?.title), meta].filter(Boolean).join(' · ');
}

function buildShareTitle(conversation, fallback) {
  return sanitizeCopy(conversation?.title) || fallback || 'Conversation';
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const conversation = await fetchConversation(slug, { silent: true });
  if (!conversation) return {};

  const summary = buildConversationSummary(conversation);
  const pageUrl = `${SITE.url}/conversations/${conversation.slug}`;
  const hasCover = conversation.show_cover && conversation.cover_image_url;
  const openGraphImages = hasCover
    ? [
        {
          url: conversation.cover_image_url,
          width: 1600,
          height: 1200,
          alt: summary || conversation.title || 'Conversation cover',
        },
      ]
    : undefined;

  return {
    title: conversation.title,
    description: summary,
    openGraph: {
      title: conversation.title,
      description: summary,
      url: pageUrl,
      images: openGraphImages,
      type: 'article',
    },
    twitter: {
      card: hasCover ? 'summary_large_image' : 'summary',
      title: conversation.title,
      description: summary,
      images: hasCover ? [conversation.cover_image_url] : undefined,
    },
  };
}

export default async function ConversationPublicPage({ params }) {
  const { slug } = await params;
  const conversation = await fetchConversation(slug);

  if (!conversation) {
    return (
      <div className='mx-auto w-full max-w-[92vw] py-10 text-center text-sm italic text-[var(--foreground)]/60 lg:max-w-5xl'>
        Conversation not found.
      </div>
    );
  }

  const [conversationNumber, items] = await Promise.all([
    fetchConversationNumber(conversation.published_at),
    fetchConversationItems(conversation.id),
  ]);

  const summary = buildConversationSummary(conversation);
  const quote = sanitizeCopy(conversation.quote);
  const displayQuote = formatQuote(quote);
  const dateLabel = conversation.convo_date
    ? formatDate(conversation.convo_date)
    : '';
  const meta = [dateLabel, conversation.location].filter(Boolean).join(' · ');
  const shareSummary = buildShareSummary(conversation, meta);
  const shareTitle = buildShareTitle(conversation, summary);

  const blocks = items.map((item, index) => {
    const source = item.text_md ?? item.html ?? '';
    const html = item.text_md
      ? markdownToSafeHtml(source)
      : stringLooksLikeHtml(source)
      ? htmlToSafeHtml(source)
      : markdownToSafeHtml(source);
    return { id: item.id ?? `block-${index}`, html };
  });

  return (
    <article className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-4xl'>
      <header className='space-y-6 text-center'>
        <div className='flex justify-center'>
          <Link
            href='/conversations'
            className='nav-action inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em]'>
            <span aria-hidden>←</span> Back to conversations
          </Link>
        </div>

        <div className='space-y-3'>
          <h1 className='quick-view__title text-balance'>{summary}</h1>
          {conversation.title &&
          summary !== sanitizeCopy(conversation.title) ? (
            <p className='text-sm uppercase tracking-[0.32em] text-[var(--foreground)]/55'>
              {conversation.title}
            </p>
          ) : null}
        </div>

        {(dateLabel || conversation.location) && (
          <div className='flex flex-wrap justify-center gap-2 text-sm text-[var(--foreground)]/70'>
            {dateLabel && <span>{dateLabel}</span>}
            {dateLabel && conversation.location ? (
              <span aria-hidden>·</span>
            ) : null}
            {conversation.location && <span>{conversation.location}</span>}
          </div>
        )}

        {(conversation.instagram_url || conversation.website_url) && (
          <div className='flex flex-wrap justify-center gap-3 text-sm text-[var(--foreground)]/75'>
            {conversation.instagram_url && (
              <a
                href={conversation.instagram_url}
                target='_blank'
                rel='noopener noreferrer'
                className='rounded underline decoration-dotted underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/40'>
                Instagram
              </a>
            )}
            {conversation.website_url && (
              <a
                href={conversation.website_url}
                target='_blank'
                rel='noopener noreferrer'
                className='rounded underline decoration-dotted underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/40'>
                Website
              </a>
            )}
          </div>
        )}

        {quote && (
          <figure className='mx-auto max-w-2xl'>
            <blockquote className='text-base italic leading-relaxed text-[var(--foreground)]/80'>
              {displayQuote}
            </blockquote>
          </figure>
        )}

        <div className='flex justify-center'>
          <ShareButton
            title={shareTitle}
            text={shareSummary || shareTitle}
            url={`/conversations/${conversation.slug}`}
            className='nav-action inline-flex'
            buttonText='Share conversation'
          />
        </div>
      </header>

      {conversation.cover_image_url && conversation.show_cover && (
        <figure className='relative mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] border border-[var(--foreground)]/12 bg-[var(--foreground)]/5 shadow-[0_26px_80px_rgba(0,0,0,0.18)]'>
          <div className='relative aspect-[4/3] w-full'>
            <EAImage
              src={conversation.cover_image_url}
              alt={summary || conversation.title || 'Conversation cover'}
              fill
              className='object-cover'
              priority
            />
          </div>
          {quote ? <figcaption className='sr-only'>{quote}</figcaption> : null}
        </figure>
      )}

      <section className='mx-auto max-w-3xl space-y-8 rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.12)] sm:p-10'>
        <article className='ea-prose space-y-6'>
          {blocks.length > 0 ? (
            blocks.map((block) => (
              <div
                key={block.id}
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            ))
          ) : (
            <p className='text-sm italic text-[var(--foreground)]/65'>
              Conversation transcript coming soon.
            </p>
          )}
        </article>
      </section>

      <footer className='flex justify-center'>
        <Link
          href='/conversations'
          className='nav-action inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em]'>
          Browse all conversations
          <span aria-hidden>→</span>
        </Link>
      </footer>
    </article>
  );
}
