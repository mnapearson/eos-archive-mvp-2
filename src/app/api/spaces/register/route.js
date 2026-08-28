import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  const supabaseAdmin = getSupabaseAdmin();
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { spaceName, spaceType, cityName, address, description, website, isLeico, latitude, longitude } = body;

  if (!spaceName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('spaces').insert([{
    user_id: user.id,
    name: spaceName,
    type: spaceType,
    city: cityName,
    address,
    description,
    website,
    leico: isLeico,
    latitude,
    longitude,
    status: 'pending',
  }]);

  if (error) {
    console.error('Error inserting space:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A space with this name is already registered in that city.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark this account as a space in the profiles table so the app can
  // route them to /spaces/admin instead of /account. The profiles row is
  // created by a Supabase trigger on user signup and defaults role to
  // 'member' — we update it here once the space record exists.
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'space' })
    .eq('id', user.id);

  if (profileError) {
    // Non-fatal: space was registered, but role update failed. Log it so
    // it can be fixed manually — the space admin can be corrected in the
    // Supabase dashboard by setting profiles.role = 'space' for this user.
    console.error('Space registered but failed to set profiles.role:', profileError);
  }

  return NextResponse.json({ success: true });
}
