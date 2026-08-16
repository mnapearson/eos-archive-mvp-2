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

  return NextResponse.json({ success: true });
}
