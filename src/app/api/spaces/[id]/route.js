'use server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Space ID is required' }), {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
