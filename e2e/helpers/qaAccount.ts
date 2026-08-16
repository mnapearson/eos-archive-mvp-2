import { testEmailAddress } from './testInbox';

// Every test email follows qa-{unix-timestamp}-{random6}@{domain} —
// identifiable by pattern alone (scripts/qa-cleanup.js's QA_EMAIL_PATTERN)
// so cleanup can never touch real data, and the embedded timestamp lets the
// nightly --sweep tell a fresh in-progress run from an abandoned one.
export function generateQaTag(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `qa-${timestamp}-${random}`;
}

const TEST_PASSWORD = 'Qa-Test-Password-9f3k2!';

// mailinator.com — confirmed (manual verification, this session) that
// Supabase's signup email validator accepts it, unlike @example.com,
// which it rejects outright. Used for every test that doesn't need to
// actually read the received email (most of them: client-side validation,
// admin-API-created accounts, duplicate-email checks) — a domain
// testmail.app isn't required to be configured for those to run.
export function generateQaCredentials() {
  const tag = generateQaTag();
  return { email: `${tag}@mailinator.com`, tag, password: TEST_PASSWORD };
}

// Only for the one test that actually needs to receive and read the
// confirmation email — requires TESTMAIL_NAMESPACE (and the caller should
// have already test.skip()'d on missing TESTMAIL_API_KEY/TESTMAIL_NAMESPACE
// before calling this).
export function generateQaInboxCredentials() {
  const tag = generateQaTag();
  return { email: testEmailAddress(tag), tag, password: TEST_PASSWORD };
}
