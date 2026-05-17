import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ALLOWED_IMAGE_TYPES, IMAGE_MAX_SIZE_BYTES } from '@/lib/constants';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const spaceId = formData.get('spaceId');
  const eventId = formData.get('eventId');

  if (!file || !spaceId || !eventId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  if (file.size > IMAGE_MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${IMAGE_MAX_SIZE_BYTES / 1024 / 1024}MB limit` },
      { status: 400 }
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${spaceId}-${eventId}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from('event-images')
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Image upload error:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: publicData } = supabaseAdmin.storage
    .from('event-images')
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicData.publicUrl });
}
