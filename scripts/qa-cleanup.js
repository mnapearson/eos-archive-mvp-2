// Deletes QA test accounts created by the auth/signup E2E suite
// (e2e/auth-web.spec.ts, e2e/auth-space-signup.spec.ts) — anything matching
// the qa-{timestamp}-{random6}@... email pattern, its spaces row, and its
// profiles row. Uses SUPABASE_SERVICE_ROLE_KEY, which must stay
// server-side/CI-secret only and is never logged here, including on error.
//
// Usage:
//   node scripts/qa-cleanup.js <email>   — delete one specific QA account
//   node scripts/qa-cleanup.js --sweep   — delete every QA account whose
//                                          email timestamp is >24h old
//                                          (safety net for a crashed run
//                                          that never reached its own
//                                          afterEach teardown)

// This suite creates accounts under two domains: @mailinator.com (most
// tests — no email needs to be read) and {namespace}.qa-.../@inbox.testmail.app
// (the few tests that read a real confirmation email). Anchored to exactly
// those two real domains, not left domain-agnostic, so a coincidental
// qa-<digits>-<6 chars>@ substring on an unrelated real address (e.g. a
// genuine user's SUPABASE_SERVICE_ROLE_KEY-visible mailbox on a shared
// domain) can never match. Not anchored to the start of the local part,
// since testmail.app's tag sits after a namespace + dot, not at position 0.
const QA_EMAIL_PATTERN = /qa-(\d+)-[a-z0-9]{6}@(?:mailinator\.com|inbox\.testmail\.app)$/;

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.'
    );
  }
  return { SUPABASE_URL, SERVICE_KEY };
}

async function supabaseFetch(path, { SUPABASE_URL, SERVICE_KEY }, init = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  return res;
}

// Supabase admin's list-users endpoint does NOT support server-side email
// filtering — `?email=` is silently ignored and returns the full unfiltered
// page regardless of the value passed (confirmed directly: querying with a
// garbage, definitely-nonexistent email returned the same 50 real user
// accounts as no filter at all). Every listing here pages through and
// filters client-side instead. QA volume is low enough (test suite, not
// production traffic) that this stays cheap.
async function listAllUsers(env) {
  const users = [];
  let page = 1;
  for (;;) {
    const res = await supabaseFetch(
      `/auth/v1/admin/users?page=${page}&per_page=200`,
      env
    );
    if (!res.ok) {
      throw new Error(`Failed to list users (page ${page}): ${res.status}`);
    }
    const data = await res.json();
    const batch = data.users || [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }
  return users;
}

async function listQaUsers(env) {
  const users = await listAllUsers(env);
  return users.filter((user) => QA_EMAIL_PATTERN.test(user.email || ''));
}

async function deleteQaAccount(env, user) {
  const userId = user.id;

  const spacesRes = await supabaseFetch(
    `/rest/v1/spaces?user_id=eq.${userId}`,
    env,
    { method: 'DELETE' }
  );
  if (!spacesRes.ok) {
    console.warn(`  ! failed to delete spaces row(s) for ${user.email}: ${spacesRes.status}`);
  }

  const profileRes = await supabaseFetch(
    `/rest/v1/profiles?id=eq.${userId}`,
    env,
    { method: 'DELETE' }
  );
  if (!profileRes.ok) {
    console.warn(`  ! failed to delete profiles row for ${user.email}: ${profileRes.status}`);
  }

  const userRes = await supabaseFetch(`/auth/v1/admin/users/${userId}`, env, {
    method: 'DELETE',
  });
  if (!userRes.ok) {
    throw new Error(`Failed to delete auth user ${user.email}: ${userRes.status}`);
  }

  console.log(`  ✓ deleted ${user.email}`);
}

async function cleanupUser(email) {
  const env = getEnv();
  if (!QA_EMAIL_PATTERN.test(email)) {
    throw new Error(
      `Refusing to delete "${email}" — does not match the qa- test account pattern.`
    );
  }
  const users = await listAllUsers(env);
  const user = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!user) {
    console.log(`  (no account found for ${email} — already cleaned up)`);
    return;
  }
  await deleteQaAccount(env, user);
}

async function sweepStaleUsers() {
  const env = getEnv();
  const users = await listQaUsers(env);
  const now = Date.now();
  const staleCutoffMs = 24 * 60 * 60 * 1000;

  let deleted = 0;
  for (const user of users) {
    const match = user.email.match(QA_EMAIL_PATTERN);
    const createdAtMs = Number(match[1]);
    if (Number.isNaN(createdAtMs)) continue;
    const ageMs = now - createdAtMs;
    if (ageMs < staleCutoffMs) continue;
    await deleteQaAccount(env, user);
    deleted += 1;
  }
  console.log(`Sweep complete: ${deleted} stale QA account(s) deleted, ${users.length - deleted} left (still under 24h old).`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/qa-cleanup.js <email> | --sweep');
    process.exit(1);
  }
  if (arg === '--sweep') {
    await sweepStaleUsers();
  } else {
    await cleanupUser(arg);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('qa-cleanup failed:', err.message);
    process.exit(1);
  });
}

module.exports = { cleanupUser, sweepStaleUsers, QA_EMAIL_PATTERN };
