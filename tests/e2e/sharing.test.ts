import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const OWNER_EMAIL = `e2e_owner_${Date.now()}@example.com`;
const VIEWER_EMAIL = `e2e_viewer_${Date.now()}@example.com`;
const PASSWORD = 'testpass123';

test.beforeAll(async () => {
  await admin.auth.admin.createUser({ email: OWNER_EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { preferred_username: `owner_${Date.now()}` } });
  await admin.auth.admin.createUser({ email: VIEWER_EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { preferred_username: `viewer_${Date.now()}` } });
});

test.afterAll(async () => {
  const { data } = await admin.auth.admin.listUsers();
  for (const u of data.users.filter(u => [OWNER_EMAIL, VIEWER_EMAIL].includes(u.email!))) {
    await admin.auth.admin.deleteUser(u.id);
  }
});

test('share link grants access to restricted album', async ({ page, browser }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', OWNER_EMAIL);
  await page.fill('input[name=password]', PASSWORD);
  await page.click('button:has-text("Login")');
  await page.waitForURL('/');

  await page.goto('/albums/new');
  await page.fill('input[type=text]', 'Restricted Album');
  await page.locator('input[value=restricted]').check();
  await page.click('button:has-text("Create Album")');
  await page.waitForURL(/\/upload\?albumId=/);

  const albumId = new URL(page.url()).searchParams.get('albumId')!;

  await page.goto(`/albums/${albumId}/settings`);
  await page.click('button:has-text("Create Share Link")');

  const linkInput = page.locator('input[readonly]').first();
  await expect(linkInput).toBeVisible();
  const shareUrl = await linkInput.inputValue();

  const viewerContext = await browser.newContext();
  const viewerPage = await viewerContext.newPage();
  await viewerPage.goto(shareUrl);
  await expect(viewerPage.locator('h1')).toContainText('Restricted Album');
  await viewerContext.close();
});
