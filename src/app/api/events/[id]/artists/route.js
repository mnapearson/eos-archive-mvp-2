import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// PUT /api/events/{eventId}/artists
// Body: { artistIds: number[] }
export async function PUT(request, { params }) {
  const { id: eventId } = params;
  try {
    const { artistIds } = await request.json();
    if (!Array.isArray(artistIds)) {
      return NextResponse.json({ error: 'Invalid artistIds' }, { status: 400 });
    }
    // Delete existing associations
    const { error: deleteErr } = await supabase
      .from('event_artists')
      .delete()
      .eq('event_id', eventId);
    if (deleteErr) throw deleteErr;

    // Insert new associations
    const rows = artistIds.map((id) => ({ event_id: eventId, artist_id: id }));
    const { error: insertErr } = await supabase
      .from('event_artists')
      .insert(rows);
    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('error updating event_artists:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
