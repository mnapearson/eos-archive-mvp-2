import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Mirrors scripts/airtable-sync.js and scripts/sync-events.js in the
// eos-archive-app (mobile) repo. Netlify Functions bundle from this repo
// only, so the sync logic is inlined here rather than shelled out to those
// scripts. Keep this in sync manually if the mobile repo's scripts change.

const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || 'appYNHLKlGrMQXebq';
const SPACES_TABLE = 'tblNOa25TlexYcvQF';
const EVENTS_TABLE = 'Events Import';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function airtableFetch(table, filterFormula) {
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (filterFormula) params.set('filterByFormula', filterFormula);
    if (offset) params.set('offset', offset);
    const res = await fetch(`${AIRTABLE_BASE_URL}/${encodeURIComponent(table)}?${params}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Airtable error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

async function isImageUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    return false;
  }
}

const LINK_IN_BIO_DOMAINS = [
  'linktr.ee',
  'linktree.com',
  'beacons.ai',
  'bio.link',
  'lnk.bio',
  'solo.to',
  'campsite.bio',
  'msha.ke',
  'linkin.bio',
  'shor.by',
  'carrd.co', // often used as a minimal bio page too — skip to be safe
];

function isLinkInBioUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return LINK_IN_BIO_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; eosarchive-bot/1.0)' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const twitterMatch =
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    const found = (ogMatch || twitterMatch)?.[1];
    if (!found) return null;

    const resolved = new URL(found, res.url).href;
    return (await isImageUrl(resolved)) ? resolved : null;
  } catch {
    return null;
  }
}

async function syncSpaces() {
  console.log('eos archive · Airtable -> Supabase spaces sync');
  const records = await airtableFetch(SPACES_TABLE, `{Status} = "Ready"`);
  console.log(`Found ${records.length} ready spaces`);

  const rows = records
    .map((r) => ({
      airtable_id: r.id,
      name: r.fields['Name'] || '',
      city_name: r.fields['City'] || '',
      category: r.fields['Category'] || '',
      address: r.fields['Address'] || '',
      instagram: r.fields['Instagram'] || null,
      website: r.fields['Website'] || null,
      description: r.fields['Description'] || null,
      hero_image_url: r.fields['Hero Image URL'] || null,
      lat: r.fields['Latitude'] || null,
      lng: r.fields['Longitude'] || null,
      source: 'curated',
      is_curated: true,
      is_active: true,
    }))
    .filter((r) => r.name);

  const nameCounts = {};
  for (const row of rows) nameCounts[row.name] = (nameCounts[row.name] || 0) + 1;
  for (const row of rows) {
    if (nameCounts[row.name] > 1 && row.city_name) {
      row.name = `${row.name} (${row.city_name})`;
    }
  }

  for (const row of rows) {
    if (row.hero_image_url && !(await isImageUrl(row.hero_image_url))) {
      console.warn(`Hero Image URL is not an image for "${row.name}": ${row.hero_image_url} — clearing`);
      row.hero_image_url = null;
    }
  }

  // Never let a blank Airtable field erase a hero image that already exists
  // in Supabase (manually curated, or previously auto-fetched below).
  const { data: existingSpaces, error: existingError } = await supabase
    .from('spaces')
    .select('airtable_id, hero_image_url')
    .not('airtable_id', 'is', null);
  if (existingError) throw new Error(existingError.message);

  const existingHeroImages = new Map(
    (existingSpaces ?? []).map((s) => [s.airtable_id, s.hero_image_url])
  );
  for (const row of rows) {
    if (!row.hero_image_url && existingHeroImages.get(row.airtable_id)) {
      row.hero_image_url = existingHeroImages.get(row.airtable_id);
    }
  }

  // Backfill hero images from each space's website og:image, sequentially
  // (not in parallel) so we don't hammer a batch of venue sites at once.
  const needsImage = rows.filter((r) => r.website && !r.hero_image_url);
  for (const row of needsImage) {
    if (isLinkInBioUrl(row.website)) {
      console.log(`⊘ skipping ${row.name} — website is a link-in-bio page (${row.website})`);
      continue;
    }
    const ogImage = await fetchOgImage(row.website);
    if (ogImage) {
      row.hero_image_url = ogImage;
      console.log(`✓ hero image for ${row.name}`);
    } else {
      console.log(`✗ no image found for ${row.name} (${row.website})`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  const { error } = await supabase.from('spaces').upsert(rows, { onConflict: 'airtable_id' });
  if (error) throw new Error(error.message);
  console.log(`Upserted ${rows.length} spaces`);
  return rows.length;
}

function to24Hour(timeStr) {
  if (!timeStr) return null;
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr.trim());
  if (!match) return null;
  let [, hours, minutes, meridiem] = match;
  hours = parseInt(hours, 10);
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

async function syncEvents() {
  console.log('eos archive · Airtable -> Supabase events sync');

  const { data: spaces, error: spacesError } = await supabase
    .from('spaces')
    .select('id, airtable_id')
    .not('airtable_id', 'is', null);
  if (spacesError) throw new Error(spacesError.message);

  const spaceMap = new Map();
  for (const space of spaces ?? []) spaceMap.set(space.airtable_id, space.id);
  console.log(`Loaded ${spaceMap.size} spaces for linking`);

  const records = await airtableFetch(EVENTS_TABLE);
  console.log(`Found ${records.length} events in Airtable`);

  const rows = records
    .map((r) => {
      const fields = r.fields;
      const linkedSpaceIds = fields['Space'] || [];
      const firstLinkedId = linkedSpaceIds[0] || null;
      const spaceId = firstLinkedId ? spaceMap.get(firstLinkedId) ?? null : null;

      if (firstLinkedId && spaceId == null) {
        console.warn(
          `No matching space for "${fields['Title']}" (Airtable space ${firstLinkedId}) — space_id left null`
        );
      }

      const date = fields['Date'] || null;

      return {
        airtable_id: r.id,
        title: fields['Title'] || null,
        description: fields['Description'] || null,
        start_date: date,
        end_date: date,
        start_time: to24Hour(fields['Start Time']),
        end_time: to24Hour(fields['End Time']),
        organizer_ig: fields['Organizer Instagram'] || null,
        flyer_image_url: fields['Flyer URL'] || null,
        space_id: spaceId,
        source: 'curated',
        is_curated: true,
        is_active: true,
        approved: true,
      };
    })
    .filter((r) => r.title);

  const BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('events').upsert(batch, { onConflict: 'airtable_id' });
    if (error) throw new Error(error.message);
    upserted += batch.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }

  console.log('Events sync complete.');
  return rows.length;
}

const handler = async () => {
  const results = { spaces: null, events: null };

  try {
    const count = await syncSpaces();
    results.spaces = `ok (${count})`;
  } catch (err) {
    results.spaces = `failed: ${err.message}`;
  }

  try {
    const count = await syncEvents();
    results.events = `ok (${count})`;
  } catch (err) {
    results.events = `failed: ${err.message}`;
  }

  const failed = Object.values(results).some((v) => v.startsWith('failed'));

  return {
    statusCode: failed ? 500 : 200,
    body: JSON.stringify(results),
  };
};

// Runs at 02:00 UTC every day. Netlify also exposes this at
// /.netlify/functions/daily-sync for manual triggering via HTTP request.
export const handler_scheduled = schedule('0 2 * * *', handler);
