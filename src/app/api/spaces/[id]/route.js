'use server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];

// Space RLS has no admin-write policy — SpaceReviewPanel's approve/reject
// previously called supabase.update() directly from the client, which was
// silently no-op'd by RLS for every caller, admin or not (SELECT worked,
// UPDATE didn't). Do the status change here instead, service-role, after
// verifying the caller is actually an admin.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const body = await request.json();
  const { status } = body;
  if (!ALLOWED_STATUSES.includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('spaces')
    .update({ status })
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function GET(req, { params }) {
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
