'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Spinner from '@/components/Spinner';
import RoadmapManager from '@/components/RoadmapManager';
import EventApprovals from '@/components/EventApprovals';
import Link from 'next/link';

function slugify(s = '') {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ConversationsPanel() {
  const supabase = createClientComponentClient();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null); // conversation row
  const [md, setMd] = React.useState(''); // single text block for now

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select(
        'id, slug, title, dek, quote, convo_date, location, status, cover_image_url, updated_at, published_at'
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
      alert(error.message);
      return;
    }
    setEditing(conv);
    setEditing((prev) => ({
      ...prev,
      quote: '',
      convo_date: null,
      location: '',
    }));
    setMd('');
    await load();
  }
  async function editRow(row) {
    // fetch full row so we always have dek
    const { data: c } = await supabase
      .from('conversations')
      .select(
        'id, slug, title, dek, quote, convo_date, location, status, cover_image_url, updated_at, published_at'
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
      alert('Save first to create an ID.');
      return;
    }
    const path = `${editing.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from('conversations')
      .upload(path, file, { upsert: true });
    if (upErr) {
      alert(upErr.message);
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
      slug: editing.slug || slugify(editing.title || 'conversation'),
      status: editing.status || 'draft',
      cover_image_url: editing.cover_image_url || null,
      source: 'native',
    };
    const { data: conv, error } = await supabase
      .from('conversations')
      .upsert(payload)
      .select()
      .single();
    if (error) {
      alert(error.message);
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
        alert(insErr.message);
        return;
      }
    }

    setEditing(conv);
    await load();
    alert('Saved');
  }

  async function publishNow() {
    if (!editing?.id) {
      alert('Save first.');
      return;
    }
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', editing.id);
    if (error) {
      alert(error.message);
      return;
    }
    setEditing((prev) => ({ ...prev, status: 'published' }));
    await load();
    alert('Published');
  }

  return (
    <section className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Conversations</h2>
        <div className='flex gap-2'>
          <button
            className='button'
            onClick={startNew}>
            New
          </button>
          {editing && (
            <Link
              className='button'
              href={`/conversations/${editing.slug}`}
              target='_blank'>
              View
            </Link>
          )}
        </div>
      </div>

      <div className='grid gap-2 md:grid-cols-2'>
        <div className='space-y-2'>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <ul className='space-y-2'>
              {rows.map((r) => (
                <li
                  key={r.id}
                  className='flex items-center justify-between border rounded p-2'>
                  <div>
                    <div className='font-medium'>{r.title}</div>
                    <div className='text-xs opacity-70'>
                      {r.status} • /conversations/{r.slug}
                      {(r.convo_date || r.location) && (
                        <>
                          {' '}
                          •{' '}
                          {r.convo_date
                            ? String(r.convo_date).split('T')[0]
                            : ''}
                          {r.convo_date && r.location ? ' · ' : ''}
                          {r.location || ''}
                        </>
                      )}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <button
                      className='button'
                      onClick={() => editRow(r)}>
                      Edit
                    </button>
                    <Link
                      className='button'
                      href={`/conversations/${r.slug}`}
                      target='_blank'>
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className='space-y-3'>
          {editing ? (
            <div className='border rounded p-3 space-y-3'>
              <div className='grid gap-2 md:grid-cols-2'>
                <label className='flex flex-col gap-1'>
                  <span className='text-sm opacity-80'>Title</span>
                  <input
                    className='input'
                    value={editing.title || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                  />
                </label>
                <label className='flex flex-col gap-1'>
                  <span className='text-sm opacity-80'>Slug</span>
                  <input
                    className='input'
                    value={editing.slug || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: e.target.value })
                    }
                  />
                </label>
                <label className='flex flex-col gap-1 md:col-span-2'>
                  <span className='text-sm opacity-80'>Dek</span>
                  <textarea
                    className='input min-h-[70px]'
                    value={editing.dek || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, dek: e.target.value })
                    }
                  />
                </label>

                <label className='flex flex-col gap-1 md:col-span-2'>
                  <span className='text-sm opacity-80'>Quote</span>
                  <textarea
                    className='input min-h-[60px] italic'
                    placeholder='A short line that captures the conversation'
                    value={editing.quote || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, quote: e.target.value })
                    }
                  />
                </label>

                <label className='flex flex-col gap-1'>
                  <span className='text-sm opacity-80'>Conversation date</span>
                  <input
                    type='date'
                    className='input'
                    value={
                      editing.convo_date
                        ? String(editing.convo_date).split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setEditing({ ...editing, convo_date: e.target.value })
                    }
                  />
                </label>

                <label className='flex flex-col gap-1'>
                  <span className='text-sm opacity-80'>Location</span>
                  <input
                    type='text'
                    className='input'
                    placeholder='City, venue, etc.'
                    value={editing.location || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, location: e.target.value })
                    }
                  />
                </label>

                <label className='flex flex-col gap-1'>
                  <span className='text-sm opacity-80'>Status</span>
                  <select
                    className='input'
                    value={editing.status || 'draft'}
                    onChange={(e) =>
                      setEditing({ ...editing, status: e.target.value })
                    }>
                    <option value='draft'>draft</option>
                    <option value='published'>published</option>
                  </select>
                </label>
                <label className='flex flex-col gap-1'>
                  <span className='text-sm opacity-80'>Cover</span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={onUploadCover}
                  />
                  {editing.cover_image_url && (
                    <img
                      src={editing.cover_image_url}
                      alt=''
                      className='mt-2 max-h-40 rounded object-cover'
                    />
                  )}
                </label>
              </div>

              <div>
                <div className='text-sm opacity-80 mb-1'>Body (Markdown)</div>
                <textarea
                  className='input min-h-[180px]'
                  placeholder='Paste markdown for this conversation.'
                  value={md}
                  onChange={(e) => setMd(e.target.value)}
                />
              </div>

              <div className='flex gap-2'>
                <button
                  className='button'
                  onClick={save}>
                  Save
                </button>
                <button
                  className='button'
                  onClick={publishNow}
                  disabled={!editing?.id}>
                  Publish
                </button>
              </div>
            </div>
          ) : (
            <p className='opacity-70'>
              Select a conversation to edit, or create a new one.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch the user's profile from the "profiles" table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        router.push('/', { scroll: false });
        return;
      }

      setAuthorized(true);
      setLoading(false);
    }

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return <Spinner />;
  }

  if (!authorized) {
    return null;
  }

  return (
    <main>
      <ConversationsPanel />
      <RoadmapManager />
      <EventApprovals />
    </main>
  );
}
