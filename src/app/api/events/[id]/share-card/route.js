import { ImageResponse } from 'next/og';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { formatDate, formatTime } from '@/lib/date';
import markerColors from '@/lib/markerColors';
import { normalizeType } from '@/lib/normalize';

export const runtime = 'edge';

// Matches the Share to Social spec's card anatomy: full-bleed flyer with a
// gradient scrim into a dark metadata strip carrying the event name, date/
// venue, and — non-negotiable, not a user toggle, see the spec's "why this
// matters" section — the eos wordmark and CC license badge. Cards are
// pre-generated once and cached in Supabase Storage (this app's stand-in
// for the spec's R2 bucket, since this app deploys on Netlify, not
// Cloudflare) so a share never waits on rendering.
const DIMENSIONS = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'square' ? 'square' : 'story';
  const { width, height } = DIMENSIONS[format];
  const supabase = getSupabaseAdmin();
  const storagePath = `${format}/${id}.png`;

  const cached = await supabase.storage.from('share-cards').download(storagePath);
  if (cached.data) {
    return new Response(cached.data, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, title, start_date, start_time, image_url, flyer_image_url, space:spaces(name, city, city_name, category, type)'
    )
    .eq('id', id)
    .single();

  if (error || !event) {
    return new Response('Event not found', { status: 404 });
  }

  const flyerUrl = event.image_url || event.flyer_image_url || null;
  const spaceCategory = event.space?.category || event.space?.type;
  const accentColor = markerColors[normalizeType(spaceCategory)] || markerColors.other;
  const dateLine = [formatDate(event.start_date), formatTime(event.start_time)]
    .filter(Boolean)
    .join(' · ');
  const venueLine = [event.space?.name, event.space?.city_name ?? event.space?.city]
    .filter(Boolean)
    .join(' · ');

  const metaHeight = Math.round(height * (format === 'story' ? 0.22 : 0.28));
  const flyerHeight = height - metaHeight;
  const scrimHeight = Math.round(flyerHeight * 0.32);
  // Square has meaningfully less metadata room than Story, and a title has
  // no natural length cap — clamp it so a long one can't push the date/
  // venue line (or the eos mark/CC badge below it) off the card.
  const titleFontRatio = format === 'story' ? 0.062 : 0.05;
  const titleMaxChars = format === 'story' ? 90 : 60;
  const title =
    event.title.length > titleMaxChars
      ? `${event.title.slice(0, titleMaxChars - 1).trimEnd()}…`
      : event.title;

  const image = new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#050810',
          position: 'relative',
        }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height: flyerHeight,
            display: 'flex',
          }}>
          {flyerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flyerUrl}
              width={width}
              height={flyerHeight}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width,
                height: flyerHeight,
                display: 'flex',
                backgroundColor: accentColor,
                opacity: 0.35,
              }}
            />
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            top: flyerHeight - scrimHeight,
            width,
            height: scrimHeight,
            display: 'flex',
            background: 'linear-gradient(to bottom, rgba(5,8,16,0), rgba(5,8,16,1))',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 0,
            top: flyerHeight,
            width,
            height: metaHeight,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#07090f',
            padding: `0 ${Math.round(width * 0.06)}px`,
          }}>
          <div
            style={{
              display: 'flex',
              fontSize: Math.round(width * titleFontRatio),
              fontWeight: 700,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.15,
            }}>
            {title}
          </div>
          {(dateLine || venueLine) && (
            <div
              style={{
                display: 'flex',
                fontSize: Math.round(width * 0.03),
                color: '#888888',
                marginTop: Math.round(width * 0.025),
              }}>
              {[dateLine, venueLine].filter(Boolean).join('  ·  ').toUpperCase()}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: Math.round(width * 0.045),
            }}>
            <div
              style={{
                display: 'flex',
                fontSize: Math.round(width * 0.026),
                color: accentColor,
              }}>
              eos archive
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: Math.round(width * 0.022),
                color: '#4ade80',
              }}>
              CC BY-NC-SA
            </div>
          </div>
        </div>
      </div>
    ),
    { width, height }
  );

  const buffer = await image.arrayBuffer();

  await supabase.storage.from('share-cards').upload(storagePath, buffer, {
    contentType: 'image/png',
    cacheControl: '31536000',
  });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

// Invalidates both cached formats for an event — called after an edit or
// delete, since a title/date/flyer change would otherwise keep serving the
// stale pre-generated card indefinitely (Cache-Control is immutable).
// Requires the caller to actually own the event's space, verified
// server-side the same way /api/spaces/[id]'s PATCH does, since an
// unauthenticated version of this would let anyone force a full re-render
// (a real, if minor, cost) for any event on demand.
export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, space_id, spaces!inner(user_id)')
    .eq('id', id)
    .single();
  if (eventError || !event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const owns = event.spaces?.user_id === user.id;
  const isAdmin = profile?.role === 'admin';
  if (!owns && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  await supabase.storage.from('share-cards').remove([`story/${id}.png`, `square/${id}.png`]);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
