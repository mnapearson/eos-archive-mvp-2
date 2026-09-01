'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/date';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

const NOTE_MAX_LENGTH = 280;

function visitCountLabel(count) {
  if (count === 0) return null;
  if (count === 1) return '1 person from the archive has been here.';
  return `${count} people from the archive have been here.`;
}

// Ported from eos-archive-app/app/space/[id].tsx's "been here"/notes
// mechanics — same tables (space_visits, space_notes), same one-row-per-
// user toggle/note semantics, same 20-note/newest-first/280-char limits.
//
// MODERATION: this is public user-generated text with no report/moderation
// mechanism on mobile either — porting it as-is ships the same gap on web.
// Explicit decision for this pass: defer adding a report/flag action. No
// admin-side moderation surface exists yet to receive reports into, so a
// report button alone wouldn't actually do anything; building the receiving
// side too is a bigger, separate piece of work than this task's scope.
// Recorded here on purpose so this is a conscious deferral, not a silently
// missing feature — worth prioritizing before this sees real traffic at
// scale, since the content is public and currently un-moderatable.
export default function SpaceVisitsAndNotes({ spaceId }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [visitCount, setVisitCount] = useState(0);
  const [myVisit, setMyVisit] = useState(null);
  const [notes, setNotes] = useState([]);
  const [myNote, setMyNote] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!spaceId) return;

    supabase
      .from('space_visits')
      .select('*', { count: 'exact', head: true })
      .eq('space_id', spaceId)
      .then(({ count }) => setVisitCount(count ?? 0));

    if (!userId) {
      setMyVisit(null);
      return;
    }
    supabase
      .from('space_visits')
      .select('id')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setMyVisit(data));
  }, [spaceId, userId, supabase]);

  const fetchNotes = async () => {
    if (!spaceId) return;
    const { data } = await supabase
      .from('space_notes')
      .select('id, content, created_at, updated_at, user_id')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    const noteRows = data ?? [];
    const userIds = [...new Set(noteRows.map((n) => n.user_id))];
    const { data: profileRows } = userIds.length
      ? await supabase.from('public_profiles').select('id, username').in('id', userIds)
      : { data: [] };
    const usernameById = new Map((profileRows ?? []).map((p) => [p.id, p.username]));

    const rows = noteRows.map((n) => ({ ...n, username: usernameById.get(n.user_id) ?? null }));
    setNotes(rows);
    setMyNote(userId ? rows.find((n) => n.user_id === userId) ?? null : null);
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, userId]);

  const requireLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(`/spaces/${spaceId}`)}`);
  };

  const toggleVisit = async () => {
    if (!userId) {
      requireLogin();
      return;
    }
    if (myVisit) {
      await supabase.from('space_visits').delete().eq('id', myVisit.id);
      setMyVisit(null);
      setVisitCount((c) => c - 1);
    } else {
      const { data } = await supabase
        .from('space_visits')
        .insert({ space_id: Number(spaceId), user_id: userId })
        .select()
        .single();
      setMyVisit(data);
      setVisitCount((c) => c + 1);
    }
  };

  const openNoteModal = () => {
    if (!userId) {
      requireLogin();
      return;
    }
    setNoteDraft(myNote?.content ?? '');
    setNoteModalOpen(true);
  };

  const saveNote = async () => {
    if (!userId || !noteDraft.trim()) return;
    setSavingNote(true);
    const { error } = await supabase.from('space_notes').upsert(
      {
        space_id: Number(spaceId),
        user_id: userId,
        content: noteDraft.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,space_id' }
    );
    setSavingNote(false);
    if (error) {
      toast.error('Unable to save your note right now.');
      return;
    }
    setNoteModalOpen(false);
    fetchNotes();
  };

  const deleteNote = async () => {
    if (!myNote) return;
    setSavingNote(true);
    const { error } = await supabase.from('space_notes').delete().eq('id', myNote.id);
    setSavingNote(false);
    if (error) {
      toast.error('Unable to remove your note right now.');
      return;
    }
    setNoteModalOpen(false);
    fetchNotes();
  };

  return (
    <div className='space-y-10'>
      <section className='space-y-4'>
        <span className='ea-label ea-label--muted'>Been here</span>
        <div className='flex flex-wrap items-center gap-4'>
          <button
            type='button'
            onClick={toggleVisit}
            className={`nav-action rounded-full px-5 ${
              myVisit ? 'border-[var(--chrome)] text-[var(--chrome)] bg-[var(--chrome)]/12' : ''
            }`}>
            {myVisit ? '✓ I was here' : 'I was here'}
          </button>
          {visitCountLabel(visitCount) && (
            <p className='text-sm text-[var(--foreground)]/60'>{visitCountLabel(visitCount)}</p>
          )}
        </div>
      </section>

      <section className='space-y-4'>
        <span className='ea-label ea-label--muted'>Notes</span>

        {notes.length === 0 ? (
          <p className='text-sm italic text-[var(--foreground)]/60'>
            No notes yet. Be the first to leave one.
          </p>
        ) : (
          <ul className='divide-y divide-[var(--foreground)]/10'>
            {notes.map((note) => (
              <li key={note.id} className='space-y-1 py-3 first:pt-0'>
                <p className='text-xs uppercase tracking-[0.04em] text-[var(--foreground)]/50'>
                  @{note.username ?? 'anonymous'}
                  <span className='text-[var(--foreground)]/35'>
                    {' '}
                    · {formatRelativeTime(note.created_at)}
                  </span>
                </p>
                <p className='text-sm leading-relaxed text-[var(--foreground)]/85'>
                  {note.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button
          type='button'
          onClick={openNoteModal}
          className='nav-action rounded-full px-5 '>
          {myNote ? 'Edit your note' : '+ Leave a note'}
        </button>
      </section>

      <Modal open={noteModalOpen} onClose={() => setNoteModalOpen(false)} label='Your note'>
        <div className='space-y-4 p-2'>
          <h3 className='text-lg font-semibold text-[var(--foreground)]'>Your note</h3>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value.slice(0, NOTE_MAX_LENGTH))}
            maxLength={NOTE_MAX_LENGTH}
            rows={4}
            placeholder='A short note about this space...'
            className='w-full rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
          />
          <p className='text-xs text-[var(--foreground)]/45'>
            {noteDraft.length} / {NOTE_MAX_LENGTH}
          </p>

          <div className='flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={saveNote}
              disabled={savingNote || !noteDraft.trim()}
              className='nav-action nav-cta px-6 disabled:cursor-not-allowed disabled:opacity-60'>
              {savingNote ? 'Saving…' : 'Save note'}
            </button>
            <button
              type='button'
              onClick={() => setNoteModalOpen(false)}
              className='nav-action px-6 '>
              Cancel
            </button>
            {myNote && (
              <button
                type='button'
                onClick={deleteNote}
                disabled={savingNote}
                className='nav-action px-6 text-red-400 disabled:cursor-not-allowed disabled:opacity-60'>
                Remove note
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
