// Polls testmail.app for a confirmation email and extracts the
// confirmation link from it.
//
// testmail.app exposes two APIs: a REST/JSON GET endpoint
// (api.testmail.app/api/json) and a GraphQL endpoint
// (api.testmail.app/api/graphql). This uses the JSON one — simpler, and all
// we need is an exact-tag lookup, not GraphQL's advanced filtering.
// Confirmed against testmail.app's current docs: the exact-match query
// param is `tag` (NOT `pretag`, which isn't a real param — the earlier,
// unverified version of this file used it, which meant every request
// silently ignored the tag filter and could return any email in the
// namespace within the timestamp window).

const TESTMAIL_API_KEY = process.env.TESTMAIL_API_KEY;
const TESTMAIL_NAMESPACE = process.env.TESTMAIL_NAMESPACE;

export function testEmailAddress(tag: string): string {
  if (!TESTMAIL_NAMESPACE) {
    throw new Error('TESTMAIL_NAMESPACE is not set.');
  }
  return `${TESTMAIL_NAMESPACE}.${tag}@inbox.testmail.app`;
}

export async function waitForConfirmationLink(
  tag: string,
  timeoutMs = 60_000
): Promise<string> {
  if (!TESTMAIL_API_KEY || !TESTMAIL_NAMESPACE) {
    throw new Error('TESTMAIL_API_KEY and TESTMAIL_NAMESPACE must both be set.');
  }

  const params = new URLSearchParams({
    apikey: TESTMAIL_API_KEY,
    namespace: TESTMAIL_NAMESPACE,
    tag,
    livequery: 'true',
    // Ignore anything older than 5 minutes — avoids picking up a stale
    // email from a previous, unrelated run that reused the same tag.
    timestamp_from: String(Date.now() - 5 * 60_000),
  });

  const res = await fetch(`https://api.testmail.app/api/json?${params.toString()}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`testmail.app API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  if (data.result !== 'success' || !data.emails?.length) {
    throw new Error(
      `No confirmation email arrived for tag "${tag}" within ${timeoutMs}ms. ` +
        `If this is the first CI run, confirm TESTMAIL_API_KEY/TESTMAIL_NAMESPACE ` +
        `are set and that Supabase's SMTP is actually delivering to inbox.testmail.app.`
    );
  }

  const email = data.emails[0];
  const body: string = email.html || email.text || '';

  // Prefer an explicit Supabase verify link; fall back to any URL in the
  // body if the template doesn't match this shape (unverified assumption
  // — see file header).
  const verifyMatch = body.match(/https?:\/\/[^\s"'<>]*\/auth\/v1\/verify[^\s"'<>]*/);
  if (verifyMatch) return verifyMatch[0];

  const anyUrlMatch = body.match(/https?:\/\/[^\s"'<>]+/);
  if (anyUrlMatch) return anyUrlMatch[0];

  throw new Error('Confirmation email arrived but no URL was found in its body.');
}
