import { test, expect } from '@playwright/test';
import { generateQaCredentials, generateQaInboxCredentials } from './helpers/qaAccount';
import { waitForConfirmationLink } from './helpers/testInbox';
import { cleanupUser } from '../scripts/qa-cleanup';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createAdminUser(request: any, email: string, password: string) {
  const res = await request.post(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    data: { email, password, email_confirm: true },
  });
  expect(res.ok()).toBe(true);
  return (await res.json()).id as string;
}

async function setProfileRole(request: any, userId: string, role: string) {
  const res = await request.patch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    data: { role },
  });
  expect(res.ok()).toBe(true);
}

async function signInForToken(request: any, email: string, password: string) {
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: ANON_KEY as string, 'Content-Type': 'application/json' },
    data: { email, password },
  });
  expect(res.ok()).toBe(true);
  const data = await res.json();
  return data.access_token as string;
}

test.describe('Space signup — registration mechanism', () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, 'requires SUPABASE_SERVICE_ROLE_KEY');

  let createdEmail: string | null = null;
  let createdSpaceId: number | null = null;

  test.afterEach(async ({ request }) => {
    if (createdSpaceId) {
      await request.delete(`${SUPABASE_URL}/rest/v1/spaces?id=eq.${createdSpaceId}`, {
        headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` },
      });
      createdSpaceId = null;
    }
    if (createdEmail) {
      try {
        await cleanupUser(createdEmail);
      } catch (err) {
        console.error(`qa cleanup failed for ${createdEmail}:`, (err as Error).message);
      }
      createdEmail = null;
    }
  });

  test('registration succeeds given an existing confirmed session', async ({ request }) => {
    // Verifies the exact mechanism /spaces/signup/complete and the
    // immediate-session path both rely on — mailer_autoconfirm is false on
    // the live project (confirmed via /auth/v1/settings), so a real
    // signUp() never returns a session immediately in production as
    // currently configured; this exercises the same downstream code
    // (POST /api/spaces/register with a real session) without needing
    // that unreachable branch.
    const { email, password } = generateQaCredentials();
    createdEmail = email;

    const userId = await createAdminUser(request, email, password);
    const token = await signInForToken(request, email, password);

    const res = await request.post('/api/spaces/register', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        spaceName: `QA Test Space ${Date.now()}`,
        spaceType: 'studio',
        cityName: 'Leipzig',
        address: 'Teststrasse 1',
        description: 'Automated test — safe to delete.',
        website: 'https://example.org',
        isLeico: false,
        latitude: 51.3397,
        longitude: 12.3731,
      },
    });
    expect(res.ok()).toBe(true);

    const spacesRes = await request.get(`${SUPABASE_URL}/rest/v1/spaces?user_id=eq.${userId}&select=id,status`, {
      headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const spaces = await spacesRes.json();
    expect(spaces.length).toBe(1);
    expect(spaces[0].status).toBe('pending');
    createdSpaceId = spaces[0].id;
  });

  test('space signup completes end-to-end via the real form, including email confirmation', async ({
    page,
  }) => {
    test.skip(
      !process.env.TESTMAIL_API_KEY || !process.env.TESTMAIL_NAMESPACE,
      'requires TESTMAIL_API_KEY/TESTMAIL_NAMESPACE — see e2e/helpers/testInbox.ts'
    );

    const { email, password, tag } = generateQaInboxCredentials();
    createdEmail = email;
    const spaceName = `QA Test Space ${Date.now()}`;

    await page.goto('/spaces/signup');
    await page.locator('[data-testid="space-signup-name"]').fill(spaceName);
    await page.locator('[data-testid="space-signup-address"]').fill('Teststrasse 1');
    await page.locator('[data-testid="space-signup-city"]').fill('Leipzig');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape'); // dismiss city autocomplete suggestions if open
    await page.locator('[data-testid="space-signup-type"]').selectOption('studio');
    await page.locator('[data-testid="space-signup-email"]').fill(email);
    await page.locator('[data-testid="space-signup-password"]').fill(password);
    // Spec doesn't define space-signup-password-confirm as a required
    // testid, but the field exists — target it by id.
    await page.locator('#account-password-confirm').fill(password);
    await page.locator('[data-testid="space-signup-submit"]').click();

    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });

    const confirmationLink = await waitForConfirmationLink(tag, 60_000);
    await page.goto(confirmationLink);

    await page.waitForURL('**/spaces/admin', { timeout: 20000 });
    await expect(page.getByText(spaceName)).toBeVisible({ timeout: 10000 });
  });

  test('cross-browser/cleared-storage case shows a clear re-submit message', async ({
    page,
    context,
  }) => {
    const { email, password } = generateQaCredentials();
    createdEmail = email;

    await createAdminUser(page.request, email, password);

    // Sign in through the real form to get a genuine browser session
    // (cookies set correctly), matching what /spaces/signup/complete
    // actually depends on.
    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /connect/i }).click();
    await page.waitForTimeout(1500); // land wherever a general member lands

    // Explicitly simulate "confirmed on a different browser" — no
    // pendingSpaceRegistration was ever written in this context.
    await page.evaluate(() => localStorage.removeItem('pendingSpaceRegistration'));

    await page.goto('/spaces/signup/complete');
    await expect(page.getByText(/couldn.t find your space details/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('link', { name: /register your space/i })).toBeVisible();
  });

  test('an unfindable address shows a clear error and never calls register', async ({ page }) => {
    let registerCalled = false;
    await page.route('**/api/spaces/register', (route) => {
      registerCalled = true;
      route.continue();
    });
    // Mapbox geocoding returns zero features for a nonsense address.
    await page.route('**/geocoding/v5/mapbox.places/**', async (route) => {
      await route.fulfill({ json: { features: [] } });
    });

    const { email, password } = generateQaCredentials();
    // Not assigning createdEmail — signUp() should never fire since
    // geocoding fails before the account-creation step in handleSignUp.

    await page.goto('/spaces/signup');
    await page.locator('[data-testid="space-signup-name"]').fill('QA Geocode Fail Test');
    await page.locator('[data-testid="space-signup-address"]').fill('Nonexistent Address 999999');
    await page.locator('[data-testid="space-signup-city"]').fill('Leipzig');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.locator('[data-testid="space-signup-type"]').selectOption('studio');
    await page.locator('[data-testid="space-signup-email"]').fill(email);
    await page.locator('[data-testid="space-signup-password"]').fill(password);
    await page.locator('#account-password-confirm').fill(password);
    await page.locator('[data-testid="space-signup-submit"]').click();

    await expect(page.getByText(/unable to geocode/i)).toBeVisible({ timeout: 10000 });
    expect(registerCalled).toBe(false);
  });

  test('duplicate space name+city returns the 409 as a friendly message', async ({ request }) => {
    const { email: ownerEmail, password } = generateQaCredentials();
    createdEmail = ownerEmail;
    const spaceName = `QA Duplicate Test ${Date.now()}`;

    const userId = await createAdminUser(request, ownerEmail, password);
    const token = await signInForToken(request, ownerEmail, password);

    const payload = {
      spaceName,
      spaceType: 'bar',
      cityName: 'Leipzig',
      address: 'Teststrasse 2',
      description: 'Automated test — safe to delete.',
      website: 'https://example.org',
      isLeico: false,
      latitude: 51.34,
      longitude: 12.38,
    };

    const firstRes = await request.post('/api/spaces/register', {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
    expect(firstRes.ok()).toBe(true);

    const spacesRes = await request.get(
      `${SUPABASE_URL}/rest/v1/spaces?user_id=eq.${userId}&select=id`,
      { headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    createdSpaceId = (await spacesRes.json())[0]?.id ?? null;

    // Same name+city again — the unique constraint should produce a 409
    // with a friendly message, not a raw Postgres error.
    const secondRes = await request.post('/api/spaces/register', {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
    expect(secondRes.status()).toBe(409);
    const body = await secondRes.json();
    expect(body.error).toMatch(/already registered/i);
  });
});

test.describe('Admin approval — PATCH /api/spaces/[id]', () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, 'requires SUPABASE_SERVICE_ROLE_KEY');

  let ownerEmail: string | null = null;
  let adminEmail: string | null = null;
  let spaceIds: number[] = [];

  test.afterEach(async () => {
    for (const id of spaceIds) {
      await fetch(`${SUPABASE_URL}/rest/v1/spaces?id=eq.${id}`, {
        method: 'DELETE',
        headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` },
      });
    }
    spaceIds = [];
    for (const email of [ownerEmail, adminEmail]) {
      if (!email) continue;
      try {
        await cleanupUser(email);
      } catch (err) {
        console.error(`qa cleanup failed for ${email}:`, (err as Error).message);
      }
    }
    ownerEmail = null;
    adminEmail = null;
  });

  // This is the regression test for the exact bug manual verification
  // found: SpaceReviewPanel's original implementation called
  // supabase.update() directly from the client, which RLS silently
  // blocked for every caller including a genuine admin (SELECT worked,
  // UPDATE returned an empty array with no thrown error) — the panel's
  // optimistic UI update and success toast fired while nothing actually
  // changed in the database. Every assertion here re-fetches the row
  // independently rather than trusting a 200 response, since "the request
  // succeeded" is exactly what silently didn't prove anything last time.
  test('approve flips status and makes the space public; reject does the opposite', async ({
    request,
  }) => {
    const owner = generateQaCredentials();
    const admin = generateQaCredentials();
    ownerEmail = owner.email;
    adminEmail = admin.email;

    const ownerId = await createAdminUser(request, owner.email, owner.password);
    await createAdminUser(request, admin.email, admin.password);
    await setProfileRole(request, await getUserIdByEmail(request, admin.email), 'admin');

    const ownerToken = await signInForToken(request, owner.email, owner.password);
    const adminToken = await signInForToken(request, admin.email, admin.password);

    async function registerSpace(name: string) {
      const res = await request.post('/api/spaces/register', {
        headers: { Authorization: `Bearer ${ownerToken}` },
        data: {
          spaceName: name,
          spaceType: 'bar',
          cityName: 'Leipzig',
          address: 'Teststrasse 3',
          description: 'Automated test — safe to delete.',
          website: 'https://example.org',
          isLeico: false,
          latitude: 51.35,
          longitude: 12.39,
        },
      });
      expect(res.ok()).toBe(true);
    }

    await registerSpace(`QA Approve Test ${Date.now()}`);
    await registerSpace(`QA Reject Test ${Date.now()}`);

    const spacesRes = await request.get(
      `${SUPABASE_URL}/rest/v1/spaces?user_id=eq.${ownerId}&select=id,name&order=id.asc`,
      { headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const spaces = await spacesRes.json();
    expect(spaces.length).toBe(2);
    spaceIds = spaces.map((s: any) => s.id);
    const [approveId, rejectId] = spaceIds;

    // Approve, then re-fetch independently — never trust the 200 alone.
    const approveRes = await request.patch(`/api/spaces/${approveId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'approved' },
    });
    expect(approveRes.ok()).toBe(true);
    const approvedRow = await fetchSpaceDirect(request, approveId);
    expect(approvedRow.status).toBe('approved');
    const publicSpaces = await request.get('/api/spaces');
    const publicIds = (await publicSpaces.json()).map((s: any) => s.id);
    expect(publicIds).toContain(approveId);

    // Reject, then re-fetch independently.
    const rejectRes = await request.patch(`/api/spaces/${rejectId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'rejected' },
    });
    expect(rejectRes.ok()).toBe(true);
    const rejectedRow = await fetchSpaceDirect(request, rejectId);
    expect(rejectedRow.status).toBe('rejected');
    const publicSpaces2 = await request.get('/api/spaces');
    const publicIds2 = (await publicSpaces2.json()).map((s: any) => s.id);
    expect(publicIds2).not.toContain(rejectId);
  });

  test('a non-admin session gets 403', async ({ request }) => {
    const owner = generateQaCredentials();
    ownerEmail = owner.email;
    await createAdminUser(request, owner.email, owner.password);
    const ownerToken = await signInForToken(request, owner.email, owner.password);

    const res = await request.post('/api/spaces/register', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: {
        spaceName: `QA 403 Test ${Date.now()}`,
        spaceType: 'bar',
        cityName: 'Leipzig',
        address: 'Teststrasse 4',
        description: '',
        website: '',
        isLeico: false,
        latitude: 51.36,
        longitude: 12.4,
      },
    });
    expect(res.ok()).toBe(true);
    const ownerId = await getUserIdByEmail(request, owner.email);
    const spacesRes = await request.get(
      `${SUPABASE_URL}/rest/v1/spaces?user_id=eq.${ownerId}&select=id`,
      { headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const spaceId = (await spacesRes.json())[0].id;
    spaceIds = [spaceId];

    const patchRes = await request.patch(`/api/spaces/${spaceId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { status: 'approved' },
    });
    expect(patchRes.status()).toBe(403);
  });

  test('no auth at all gets 401', async ({ request }) => {
    const res = await request.patch('/api/spaces/1', { data: { status: 'approved' } });
    expect(res.status()).toBe(401);
  });
});

test.describe('Public spaces API', () => {
  test('every returned space has status=approved', async ({ request }) => {
    const res = await request.get('/api/spaces');
    expect(res.ok()).toBe(true);
    const spaces = await res.json();
    expect(spaces.length).toBeGreaterThan(0);
    expect(spaces.every((s: any) => s.status === 'approved')).toBe(true);
  });
});

async function getUserIdByEmail(request: any, email: string): Promise<string> {
  const res = await request.get(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const data = await res.json();
  return data.users[0].id;
}

async function fetchSpaceDirect(request: any, id: number) {
  const res = await request.get(`${SUPABASE_URL}/rest/v1/spaces?id=eq.${id}&select=*`, {
    headers: { apikey: SERVICE_KEY as string, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return (await res.json())[0];
}
