import { test, expect } from '@playwright/test';
import { generateQaCredentials, generateQaInboxCredentials } from './helpers/qaAccount';
import { waitForConfirmationLink } from './helpers/testInbox';
import { cleanupUser } from '../scripts/qa-cleanup';

// Real accounts against production (no separate test Supabase project
// exists) — every test that creates one tears it down in afterEach, in
// try/finally so a failed assertion doesn't leak the account.

test.describe('Web user signup', () => {
  let createdEmail: string | null = null;

  test.afterEach(async () => {
    if (!createdEmail) return;
    try {
      await cleanupUser(createdEmail);
    } catch (err) {
      console.error(`qa cleanup failed for ${createdEmail}:`, (err as Error).message);
    } finally {
      createdEmail = null;
    }
  });

  test('full signup succeeds end-to-end, including email confirmation', async ({ page }) => {
    test.skip(
      !process.env.TESTMAIL_API_KEY || !process.env.TESTMAIL_NAMESPACE,
      'requires TESTMAIL_API_KEY/TESTMAIL_NAMESPACE — see e2e/helpers/testInbox.ts'
    );

    const { email, password, tag } = generateQaInboxCredentials();
    createdEmail = email;

    await page.goto('/signup');
    await page.locator('[data-testid="signup-email"]').fill(email);
    await page.locator('[data-testid="signup-password"]').fill(password);
    await page.locator('[data-testid="signup-password-confirm"]').fill(password);
    await page.locator('[data-testid="signup-submit"]').click();

    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });

    const confirmationLink = await waitForConfirmationLink(tag, 60_000);
    await page.goto(confirmationLink);

    await page.waitForURL('**/account', { timeout: 15000 });
    await expect(page).toHaveURL(/\/account/);
  });

  test('password mismatch blocks submission client-side', async ({ page }) => {
    const { email, password } = generateQaCredentials();
    // Not assigning to createdEmail — signUp() should never fire for this
    // test, so there's nothing to clean up. Assert that directly below.
    let signupCalled = false;
    await page.route('**/auth/v1/signup', (route) => {
      signupCalled = true;
      route.continue();
    });

    await page.goto('/signup');
    await page.locator('[data-testid="signup-email"]').fill(email);
    await page.locator('[data-testid="signup-password"]').fill(password);
    await page.locator('[data-testid="signup-password-confirm"]').fill(`${password}x`);
    await page.locator('[data-testid="signup-submit"]').click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5000 });
    expect(signupCalled).toBe(false);
  });

  test('password under 8 characters is blocked client-side', async ({ page }) => {
    const { email } = generateQaCredentials();
    let signupCalled = false;
    await page.route('**/auth/v1/signup', (route) => {
      signupCalled = true;
      route.continue();
    });

    await page.goto('/signup');
    await page.locator('[data-testid="signup-email"]').fill(email);
    await page.locator('[data-testid="signup-password"]').fill('short1');
    await page.locator('[data-testid="signup-password-confirm"]').fill('short1');
    await page.locator('[data-testid="signup-submit"]').click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 5000 });
    expect(signupCalled).toBe(false);
  });

  test('re-submitting the same unconfirmed email shows a graceful error', async ({
    page,
    request,
  }) => {
    // Create the unconfirmed account directly via the admin API first
    // (equivalent to "already submitted the form once"), then submit the
    // real form a second time with the same email and confirm it fails
    // with a visible message rather than an unhandled exception.
    const { email, password } = generateQaCredentials();
    createdEmail = email;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    test.skip(!SUPABASE_URL || !SERVICE_KEY, 'requires SUPABASE_SERVICE_ROLE_KEY');

    const createRes = await request.post(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        apikey: SERVICE_KEY as string,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      data: { email, password, email_confirm: false },
    });
    expect(createRes.ok()).toBe(true);

    await page.goto('/signup');
    await page.locator('[data-testid="signup-email"]').fill(email);
    await page.locator('[data-testid="signup-password"]').fill(password);
    await page.locator('[data-testid="signup-password-confirm"]').fill(password);
    await page.locator('[data-testid="signup-submit"]').click();

    // Supabase should return an error for an existing unconfirmed email —
    // the form's toast.error path should surface it, not crash. No specific
    // copy assertion since Supabase's exact message text isn't part of
    // this app's contract. .toast-message is ToastProvider's own custom
    // render wrapper class, not a react-hot-toast default (which would be
    // an unstable dynamically-generated class name).
    //
    // KNOWN CURRENT GAP (verified this session, not a code bug): as of
    // this writing, signUp() for a duplicate unconfirmed email hangs
    // indefinitely with no response at all — confirmed via a direct curl
    // to /auth/v1/signup (got a 500 "Error sending confirmation email"
    // immediately) vs. the same request through the browser (still
    // nothing after 15s). This lines up with Supabase's outbound email
    // being mid-migration to Resend custom SMTP (domain verification was
    // still pending last checked) — a live external-service state, not
    // something in this app's control. signup/page.js's handleSignUp now
    // has proper try/catch/finally (previously missing entirely, which
    // would have left the submit button stuck forever with zero feedback
    // on ANY unexpected failure, not just this one) — so once Supabase's
    // email sending is actually working again, this should pass as-is.
    await expect(page.locator('.toast-message').first()).toBeVisible({ timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/account/);
  });

  test('session persists across reload once logged in', async ({ page, request }) => {
    // Doesn't depend on the real confirmation-email flow (test 1's job) —
    // exercises the same session-persistence mechanism via a pre-confirmed
    // account created directly and signed in through the real /login form.
    const { email, password } = generateQaCredentials();
    createdEmail = email;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    test.skip(!SUPABASE_URL || !SERVICE_KEY, 'requires SUPABASE_SERVICE_ROLE_KEY');

    const createRes = await request.post(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        apikey: SERVICE_KEY as string,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      data: { email, password, email_confirm: true, user_metadata: { account_type: 'member' } },
    });
    expect(createRes.ok()).toBe(true);

    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    // Login page's submit button reads "Connect", not "Sign in".
    await page.getByRole('button', { name: /connect/i }).click();
    await page.waitForURL('**/account', { timeout: 15000 });

    await page.reload();
    // URL alone is the reliable signal here: if the session had been lost
    // on reload, account/page.js would redirect back to /login. A NavBar
    // text assertion would additionally depend on profiles.role being set
    // to 'member' for this test account, which isn't guaranteed for an
    // admin-API-created user and isn't what this test is actually about.
    await expect(page).toHaveURL(/\/account/);
  });

  test('unauthenticated /account redirects to /login', async ({ page }) => {
    // middleware.js doesn't gate this route server-side — this is
    // client-side-only protection today. Revisit this assertion if
    // server-side protection is added later.
    await page.goto('/account');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
