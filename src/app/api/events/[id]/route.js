import { supabase } from '@/lib/supabaseClient';

export async function GET(req, { params }) {
  const { id } = params;
  // Query the events table and join the related space record.
  // We alias the joined data as "space" for clarity.
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      *,
      space:spaces(
        id,
        name,
        type,
        latitude,
        longitude,
        city
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}
