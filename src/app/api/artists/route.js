import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// POST /api/artists
// Body: { names: string[] }
export async function POST(request) {
  try {
    const { names } = await request.json();
    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: 'Invalid names array' },
        { status: 400 }
      );
    }

    const artistIds = [];
    for (const name of names) {
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      // Upsert artist by name
      const { data: upserted, error: upsertErr } = await supabase
        .from('artists')
        .upsert({ name, slug }, { onConflict: 'name' })
        .select('id')
        .single();
      if (upsertErr) throw upsertErr;
      artistIds.push(upserted.id);
    }

    return NextResponse.json({ artistIds });
  } catch (error) {
    console.error('error upserting artists:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
