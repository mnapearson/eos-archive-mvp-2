'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/Spinner';
import SpaceReviewPanel from '@/components/SpaceReviewPanel';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { slugify } from '@/lib/normalize';

const inputClasses =
  'input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25';

function ConversationsPanel() {
  const supabase = getSupabaseBrowserClient();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null); // conversation row
  const [md, setMd] = React.useState(''); // single text block for now

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select(
        'id, slug, title, dek, quote, convo_date, location, instagram_url, website_url, status, cover_image_url, show_cover, updated_at, published_at'
      )
      .order('updated_at', { ascending: false });
    if (!error) setRows(data || []);
    setLoading(false);
  }

  React.useEffect(() => {
    load();
  }, []);

  async function startNew() {
    const now = Date.now();
    const title = 'Untitled conversation';
    const slug = `untitled-${now}`;
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ title, slug, status: 'draft', source: 'native' })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditing(conv);
    setEditing((prev) => ({
      ...prev,
      quote: '',
      convo_date: null,
      location: '',
      instagram_url: '',
      website_url: '',
      show_cover: false,
    }));
    setMd('');
    await load();
  }
  async function editRow(row) {
    // fetch full row so we always have dek
    const { data: c } = await supabase
      .from('conversations')
      .select(
        'id, slug, title, dek, quote, convo_date, location, instagram_url, website_url, status, cover_image_url, show_cover, updated_at, published_at'
      )
      .eq('id', row.id)
      .single();

    const convo = c || row;
    setEditing(convo);

    const { data: items } = await supabase
      .from('conversation_items')
      .select('*')
      .eq('conversation_id', convo.id)
      .order('idx', { ascending: true });

    const first = (items || []).find((i) => i.kind === 'text');
    setMd(first?.text_md || first?.html || '');
  }

  async function onUploadCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!editing?.id) {
      toast.error('Save first to create an ID.');
      return;
    }
    const path = `${editing.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from('conversations')
      .upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage
      .from('conversations')
      .getPublicUrl(path);
    setEditing((prev) => ({ ...prev, cover_image_url: pub.publicUrl }));
  }

  async function save() {
    if (!editing) return;
    const payload = {
      id: editing.id,
      title: editing.title,
      dek: editing.dek || null,
      quote: editing.quote || null,
      convo_date: editing.convo_date || null,
      location: editing.location || null,
      instagram_url: editing.instagram_url || null,
      website_url: editing.website_url || null,
      slug:
        editing.slug ||
        slugify(editing.title || 'conversation') ||
        `conversation-${Date.now().toString(36)}`,
      status: editing.status || 'draft',
      cover_image_url: editing.cover_image_url || null,
      show_cover: !!editing.show_cover,
      source: 'native',
    };
    const { data: conv, error } = await supabase
      .from('conversations')
      .upsert(payload)
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }

    // replace items with a single text block for now
    await supabase
      .from('conversation_items')
      .delete()
      .eq('conversation_id', conv.id);
    if (md && md.trim()) {
      const { error: insErr } = await supabase
        .from('conversation_items')
        .insert({
          conversation_id: conv.id,
          idx: 0,
          kind: 'text',
          text_md: md,
        });
      if (insErr) {
        toast.error(insErr.message);
        return;
      }
    }

    setEditing(conv);
    await load();
    toast.success('Saved');
  }

  async function publishNow() {
    if (!editing?.id) {
      toast.error('Save first.');
      return;
    }
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', editing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditing((prev) => ({ ...prev, status: 'published' }));
    await load();
    toast.success('Published');
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]'>
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='ea-label ea-label--muted'>Entries</span>
          <button
            type='button'
            onClick={startNew}
            className='nav-action nav-cta !inline-flex px-4 text-[11px] uppercase tracking-[0.28em]'>
            New
          </button>
        </div>

        {loading ? (
          <p className='text-sm text-[var(--foreground)]/60'>Loading…</p>
        ) : rows.length === 0 ? (
          <p className='text-sm text-[var(--foreground)]/60'>No conversations yet.</p>
        ) : (
          <ul className='space-y-2'>
            {rows.map((r) => (
              <li
                key={r.id}
                className={`rounded-2xl border p-3 transition ${
                  editing?.id === r.id
                    ? 'border-[var(--chrome)]/45 bg-[var(--chrome)]/10'
                    : 'border-[var(--foreground)]/14 bg-[var(--background)]/70'
                }`}>
                <div className='min-w-0'>
                  <div className='truncate text-sm font-semibold text-[var(--foreground)]'>
                    {r.title}
                  </div>
                  <div className='mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/50'>
                    {r.status} · /conversations/{r.slug}
                    {(r.convo_date || r.location) && (
                      <>
                        {' '}
                        ·{' '}
                        {r.convo_date ? String(r.convo_date).split('T')[0] : ''}
                        {r.convo_date && r.location ? ' · ' : ''}
                        {r.location || ''}
                      </>
                    )}
                  </div>
                </div>
                <div className='mt-3 flex gap-2'>
                  <button
                    type='button'
                    onClick={() => editRow(r)}
                    className='nav-action !inline-flex px-3 text-[10px] uppercase tracking-[0.24em]'>
                    Edit
                  </button>
                  <Link
                    href={`/conversations/${r.slug}`}
                    target='_blank'
                    className='nav-action !inline-flex px-3 text-[10px] uppercase tracking-[0.24em]'>
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        {editing ? (
          <div className='space-y-6 rounded-3xl border border-[var(--foreground)]/16 bg-[var(--background)]/75 p-6 sm:p-8'>
            <div className='grid gap-4 md:grid-cols-2'>
              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Title</span>
                <input
                  className={inputClasses}
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </label>
              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Slug</span>
                <input
                  className={inputClasses}
                  value={editing.slug || ''}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </label>
              <label className='space-y-2 md:col-span-2'>
                <span className='ea-label ea-label--muted'>Dek</span>
                <textarea
                  className={`${inputClasses} min-h-[70px]`}
                  value={editing.dek || ''}
                  onChange={(e) => setEditing({ ...editing, dek: e.target.value })}
                />
              </label>

              <label className='space-y-2 md:col-span-2'>
                <span className='ea-label ea-label--muted'>Quote</span>
                <textarea
                  className={`${inputClasses} min-h-[60px] italic`}
                  placeholder='A short line that captures the conversation'
                  value={editing.quote || ''}
                  onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
                />
              </label>

              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Conversation date</span>
                <input
                  type='date'
                  className={inputClasses}
                  value={editing.convo_date ? String(editing.convo_date).split('T')[0] : ''}
                  onChange={(e) => setEditing({ ...editing, convo_date: e.target.value })}
                />
              </label>

              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Location</span>
                <input
                  type='text'
                  className={inputClasses}
                  placeholder='City, venue, etc.'
                  value={editing.location || ''}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                />
              </label>

              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Instagram URL</span>
                <input
                  type='url'
                  inputMode='url'
                  className={inputClasses}
                  placeholder='https://instagram.com/username'
                  value={editing.instagram_url || ''}
                  onChange={(e) => setEditing({ ...editing, instagram_url: e.target.value })}
                />
              </label>

              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Website URL</span>
                <input
                  type='url'
                  inputMode='url'
                  className={inputClasses}
                  placeholder='https://example.org'
                  value={editing.website_url || ''}
                  onChange={(e) => setEditing({ ...editing, website_url: e.target.value })}
                />
              </label>

              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Status</span>
                <select
                  className={inputClasses}
                  value={editing.status || 'draft'}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value='draft'>draft</option>
                  <option value='published'>published</option>
                </select>
              </label>
              <label className='space-y-2'>
                <span className='ea-label ea-label--muted'>Cover</span>
                <input type='file' accept='image/*' onChange={onUploadCover} className='text-sm text-[var(--foreground)]/70' />
                {editing.cover_image_url && (
                  <img
                    src={editing.cover_image_url}
                    alt=''
                    className='mt-2 max-h-40 rounded-2xl object-cover'
                  />
                )}
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={!!editing.show_cover}
                  onChange={(e) => setEditing({ ...editing, show_cover: e.target.checked })}
                />
                <span className='text-sm text-[var(--foreground)]/70'>Show cover on public page</span>
              </label>
            </div>

            <div className='space-y-2'>
              <span className='ea-label ea-label--muted'>Body (Markdown)</span>
              <textarea
                className={`${inputClasses} min-h-[180px]`}
                placeholder='Paste markdown for this conversation.'
                value={md}
                onChange={(e) => setMd(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:gap-4'>
              <button
                type='button'
                onClick={save}
                className='nav-action nav-cta !inline-flex w-full justify-center px-6 text-[11px] uppercase tracking-[0.32em] sm:w-auto'>
                Save
              </button>
              <button
                type='button'
                onClick={publishNow}
                disabled={!editing?.id}
                className='nav-action !inline-flex w-full justify-center px-6 text-[11px] uppercase tracking-[0.28em] disabled:opacity-50 sm:w-auto'>
                Publish
              </button>
            </div>
          </div>
        ) : (
          <p className='text-sm text-[var(--foreground)]/60'>
            Select a conversation to edit, or create a new one.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <React.Suspense
      fallback={
        <div className='flex justify-center py-20'>
          <Spinner />
        </div>
      }>
      <AdminPageContent />
    </React.Suspense>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Session/role come from AuthContext instead of this page's own
  // getSession()/profiles fetch — see AuthContext.js for why an
  // independent auth-state read here was a latent instance of the same
  // race that hung /spaces/signup/complete. This is a strict gate (the
  // site admin panel), so it waits for both `loading` (session) and
  // `profileLoading` (role) to settle before deciding — checking
  // profile?.role too early would treat "haven't fetched yet" the same
  // as "confirmed not admin" and could bounce a real admin.
  const { user, profile, loading, profileLoading } = useAuth();
  const [redirected, setRedirected] = useState(false);

  const allowedTabs = ['conversations', 'spaces'];
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab && allowedTabs.includes(tab) ? tab : 'conversations';
  });

  const tabOptions = useMemo(
    () => [
      { id: 'conversations', label: 'Conversations' },
      { id: 'spaces', label: 'Space submissions' },
    ],
    []
  );

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      router.push('/login');
      setRedirected(true);
      return;
    }

    if (profile?.role !== 'admin') {
      router.push('/', { scroll: false });
      setRedirected(true);
    }
  }, [loading, profileLoading, user, profile, router]);

  if (loading || profileLoading || redirected) {
    return <Spinner />;
  }

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-10 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Site admin</span>
          <h1 className='quick-view__title text-balance'>eos archive control room</h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
            Manage conversations and review incoming space registrations.
          </p>
        </header>

        <nav className='flex flex-wrap gap-3 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/70'>
          {tabOptions.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`nav-action !inline-flex px-4 transition ${
                  isActive
                    ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                    : ''
                }`}>
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/92 p-6 backdrop-blur-2xl sm:p-10'>
          {activeTab === 'conversations' ? <ConversationsPanel /> : <SpaceReviewPanel />}
        </section>
      </div>
    </main>
  );
}
