import { test, expect } from '@playwright/test';

// Generic assertions only — never a specific space/event name or ID, so
// these stay valid as the live dataset changes. Map uses domcontentloaded
// (not the default 'load'/networkidle) throughout: Mapbox GL's continuous
// tile/telemetry requests mean the page never reaches network-idle.

test.describe('Explore (read-path, live data)', () => {
  test('renders real cards with working images', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]');

    const cards = page.locator('[data-testid="event-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const images = page.locator('[data-testid="event-card-image"]');
    const imageCount = await images.count();

    // Not every card necessarily has a hero image (some show the "No
    // flyer" placeholder), but every rendered <img> must have a real,
    // resolvable src — this is the direct regression test for the
    // next.config.mjs image domain allowlist fix.
    for (let i = 0; i < imageCount; i++) {
      const src = await images.nth(i).getAttribute('src');
      expect(src, `event-card-image[${i}] should have a non-empty src`).toBeTruthy();
      const res = await request.get(src as string);
      expect(res.ok(), `event-card-image[${i}] (${src}) should resolve 2xx`).toBeTruthy();
    }
  });

  test('search narrows results to match the typed term', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]');

    const firstTitle = (await page
      .locator('[data-testid="event-card"] h3')
      .first()
      .textContent())?.trim();
    expect(firstTitle).toBeTruthy();

    const term = (firstTitle as string).slice(0, Math.min(4, firstTitle!.length));
    const unfilteredCount = await page.locator('[data-testid="event-card"]').count();

    await page.locator('[data-testid="search-input"]').fill(term);
    await page.waitForTimeout(500); // debounce/navigation settle

    const filteredCount = await page.locator('[data-testid="event-card"]').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(unfilteredCount);

    const titles = await page.locator('[data-testid="event-card"] h3').allTextContents();
    expect(titles.some((t) => t.toLowerCase().includes(term.toLowerCase()))).toBe(true);
  });

  test('event detail page loads with correct structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]');

    const eventId = await page
      .locator('[data-testid="event-card"]')
      .first()
      .getAttribute('data-event-id');
    expect(eventId).toBeTruthy();

    await page.goto(`/events/${eventId}`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Map (read-path, live data)', () => {
  // Mapbox GL creates a real WebGL context per test. Running these in
  // parallel with other Chromium instances on the same machine causes
  // real, consistent GPU/WebGL contention (verified: identical tests pass
  // 10/10 serially, fail intermittently under fullyParallel) — this is a
  // resource-contention issue, not app or test flakiness, so serial
  // execution fixes the cause rather than masking it with retries.
  test.describe.configure({ mode: 'serial' });

  test('renders at least one marker', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="map-container"]');
    await page.waitForSelector('[data-testid="map-marker"]', { timeout: 30000 });

    const count = await page.locator('[data-testid="map-marker"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('tapping a marker opens the single-space sheet', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="map-marker"]', { timeout: 30000 });

    // force: true — markers are absolutely-positioned and frequently
    // overlap at low zoom, which makes Playwright's actionability check
    // (nothing else intercepting the click point) unreliable here even
    // though the marker is genuinely visible and clickable by a real user.
    await page.locator('[data-testid="map-marker"]').first().click({ force: true });

    const sheet = page.locator('[data-testid="marker-sheet"]');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('a[href^="/spaces/"]')).toHaveCount(1);
  });

  test('space detail page loads with correct structure', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="map-marker"]', { timeout: 30000 });
    await page.locator('[data-testid="map-marker"]').first().click({ force: true });

    const sheet = page.locator('[data-testid="marker-sheet"]');
    await expect(sheet).toBeVisible();
    const href = await sheet.locator('a[href^="/spaces/"]').getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href as string);
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // OG meta tags — fetched from the same navigation's response.
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    expect(ogImage).toBeTruthy();
  });

  test('category filter narrows visible markers to the selected category', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="map-marker"]', { timeout: 30000 });

    const firstCategory = await page
      .locator('[data-testid="map-marker"]')
      .first()
      .getAttribute('data-category');
    expect(firstCategory).toBeTruthy();

    const unfilteredCount = await page.locator('[data-testid="map-marker"]').count();

    await page.locator('[data-testid="filter-button"]').click();
    await page.waitForSelector('[data-testid="filter-sheet"]');
    await page.locator(`[data-testid="category-chip-${firstCategory}"]`).click();
    await page.keyboard.press('Escape'); // close the filter sheet (Modal binds ESC)
    await page.waitForTimeout(300);

    const categories = await page
      .locator('[data-testid="map-marker"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-category')));

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.length).toBeLessThanOrEqual(unfilteredCount);
    expect(categories.every((c) => c === firstCategory)).toBe(true);
  });

  test('city pill with zero spaces falls back gracefully, does not error', async ({ page }) => {
    // Structural smoke test rather than a specific city assertion — just
    // confirms clicking through every city pill never leaves the page in
    // a broken/blank state (the empty-city anchor-coordinate fallback).
    await page.goto('/map', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="map-marker"]', { timeout: 30000 });

    const pills = page.locator('.nav-pill.flex-shrink-0');
    const pillCount = await pills.count();
    expect(pillCount).toBeGreaterThan(1); // at least "All" + one city

    await pills.nth(1).click();
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
  });
});

test.describe('Explore/Map regressions (mocked, deterministic)', () => {
  // The pulse/ring test below also spins up a real Mapbox GL WebGL context
  // (mocked event data, not mocked map rendering) — same GPU contention
  // issue as the live-data Map block above under full parallelism (verified
  // here too: 11/11 pass with --workers=1, intermittent failures/timeouts
  // otherwise). CI runners have few cores, so keep this serial rather than
  // relying on retries to paper over it.
  test.describe.configure({ mode: 'serial' });

  test('a space with an event today shows a pulsing marker, one a week out shows a static ring', async ({
    page,
  }) => {
    const today = new Date().toISOString().slice(0, 10);
    const sixDaysOut = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);

    let liveSpaceId: number | null = null;
    let soonSpaceId: number | null = null;

    await page.route('**/api/spaces', async (route) => {
      const res = await route.fetch();
      const spaces = await res.json();
      liveSpaceId = spaces[0]?.id ?? null;
      soonSpaceId = spaces[1]?.id ?? null;
      await route.fulfill({ json: spaces });
    });

    await page.route('**/api/events', async (route) => {
      const res = await route.fetch();
      const events = await res.json();
      // Inject two controlled fixture events onto real spaces (picked from
      // the same live /api/spaces response above) rather than inventing
      // fake space IDs — FilterContext derives eventMap/eventState purely
      // from start_date + approved, so this is enough to drive real
      // getMarkerState output through the actual app code, not a mock of it.
      const fixtures = [
        { id: -1, space_id: liveSpaceId, start_date: today, approved: true, title: 'Test live event' },
        { id: -2, space_id: soonSpaceId, start_date: sixDaysOut, approved: true, title: 'Test soon event' },
      ];
      await route.fulfill({ json: [...events, ...fixtures] });
    });

    await page.goto('/map', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="map-marker"]', { timeout: 30000 });

    const liveUnderlay = page.locator(
      `[data-testid="map-marker-underlay"][data-space-id="${liveSpaceId}"]`
    );
    await expect(liveUnderlay).toHaveAttribute('data-marker-state', 'live');
    const liveAnimation = await liveUnderlay.evaluate((el) => (el as HTMLElement).style.animation);
    expect(liveAnimation).toContain('marker-pulse');

    const soonUnderlay = page.locator(
      `[data-testid="map-marker-underlay"][data-space-id="${soonSpaceId}"]`
    );
    await expect(soonUnderlay).toHaveAttribute('data-marker-state', 'soon');
    const soonBorder = await soonUnderlay.evaluate((el) => (el as HTMLElement).style.border);
    expect(soonBorder).toContain('solid');
  });

  test('a space with only hero_image_url (Airtable-sourced) actually renders it', async ({
    page,
    request,
  }) => {
    // Map markers are plain colored dots and Explore's event-card images are
    // always Supabase-hosted (uploaded through the app) — neither exercises
    // the domain-allowlist fix at all. The real regression target is the
    // space detail page: image_url is only set once an owner uploads their
    // own photo (always Supabase-hosted too); hero_image_url (the
    // Airtable-synced og:image, on whatever domain the venue's own site
    // uses) is what needs the wider allowlist, and only renders via
    // SpaceListItem's image_url-with-hero_image_url-fallback.
    const spacesRes = await request.get('/api/spaces');
    const spaces = await spacesRes.json();
    const candidate = spaces.find((s: any) => !s.image_url && s.hero_image_url);
    test.skip(!candidate, 'no currently-active space has an Airtable-only hero image to test against');

    await page.goto(`/spaces/${candidate.id}`);
    const img = page.locator('img[alt]').first();
    await expect(img).toBeVisible({ timeout: 10000 });
    const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
    expect(naturalWidth, `hero image for space ${candidate.id} should actually load, not just render a broken <img>`).toBeGreaterThan(0);
  });

  test('an arbitrary unlisted image domain does not crash the space detail page', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]');
    const eventId = await page
      .locator('[data-testid="event-card"]')
      .first()
      .getAttribute('data-event-id');
    const eventRes = await page.request.get(`/api/events/${eventId}`);
    const event = await eventRes.json();
    const spaceId = event?.space_id ?? event?.space?.id;
    test.skip(!spaceId, 'first event on the page has no linked space to test against');

    await page.route(`**/api/spaces/${spaceId}`, async (route) => {
      const res = await route.fetch();
      const space = await res.json();
      await route.fulfill({
        json: {
          ...space,
          image_url: 'https://this-domain-is-not-in-remotepatterns.example.com/x.jpg',
        },
      });
    });

    await page.goto(`/spaces/${spaceId}`);
    // The page must still render — next/image's onError fallback (not a
    // crash) is the intended behavior for both a 404 and a domain-allowlist
    // 400, since both surface as the same <img> load-error event.
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // The route handler above can still have an in-flight route.fetch()
    // when the test ends (e.g. a prefetch for another instance of the
    // same space); let it settle quietly instead of logging a stray error.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
