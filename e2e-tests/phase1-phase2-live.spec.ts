import { mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { getCustomerRlsClient, createLiveFixture, cleanupLiveFixture, provisionLiveFixture, type LiveFixture } from "./fixtures/phase1-phase2-live";

test.use({
  launchOptions: { headless: false, slowMo: 1000 },
  viewport: { width: 1280, height: 720 },
  video: { mode: "on", size: { width: 1280, height: 720 } },
});

let fixture: LiveFixture | undefined;

test.beforeEach(async () => {
  fixture = await createLiveFixture();
  await provisionLiveFixture(fixture);
});

test.afterEach(async () => {
  if (!fixture) return;
  await cleanupLiveFixture(fixture);
  fixture = undefined;
});

test("Phase 1 and Phase 2 live user/vendor flow with separate headed sessions", async ({ browser }) => {
  test.setTimeout(180000);
  if (!fixture) throw new Error("The live Supabase fixture was not initialized.");
  const currentFixture = fixture;
  const baseUrl = process.env.DYAD_TEST_BASE_URL ?? "http://localhost:32100";
  const videoDirectory = resolve(process.cwd(), "test-videos");
  await mkdir(videoDirectory, { recursive: true });
  const userContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: videoDirectory, size: { width: 1280, height: 720 } },
    permissions: ["geolocation"],
    geolocation: { latitude: 30.0444, longitude: 31.2357 },
  });
  const vendorContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: videoDirectory, size: { width: 1280, height: 720 } },
  });
  const userPage = await userContext.newPage();
  const vendorPage = await vendorContext.newPage();
  const userVideo = userPage.video();
  const vendorVideo = vendorPage.video();
  const gotoApp = (path: string) => new URL(path, baseUrl).href;

  try {
    await Promise.all([userPage.goto(gotoApp("/login")), vendorPage.goto(gotoApp("/login"))]);

    await userPage.getByLabel("Email").fill("test.driver@synly.dev");
    await userPage.getByLabel("Password", { exact: true }).fill(currentFixture.customerPassword);
    await userPage.getByRole("button", { name: "Sign In" }).click();
    await expect(userPage).toHaveURL(/\/user$/);
    await userPage.waitForTimeout(1200);

    await vendorPage.getByLabel("Email").fill("test.vendor@synly.dev");
    await vendorPage.getByLabel("Password", { exact: true }).fill(currentFixture.vendorPassword);
    await vendorPage.getByRole("button", { name: "Sign In" }).click();
    await expect(vendorPage).toHaveURL(/\/dashboard$/);
    await vendorPage.waitForTimeout(1200);

    await Promise.all([userPage.reload(), vendorPage.reload()]);
    await expect(userPage).toHaveURL(/\/user$/);
    await expect(vendorPage).toHaveURL(/\/dashboard$/);
    await expect(userPage).not.toHaveURL(/\/login/);
    await expect(vendorPage).not.toHaveURL(/\/login/);
    await Promise.all([userPage.waitForTimeout(1200), vendorPage.waitForTimeout(1200)]);

    await userPage.goto(gotoApp("/user/profile"));
    const updatedName = `Live E2E Driver ${Date.now()}`;
    await userPage.getByLabel("Full Name").fill(updatedName);
    await userPage.getByRole("button", { name: "Save Changes" }).click();
    await expect(userPage.getByText("Profile updated successfully.")).toBeVisible();
    await userPage.waitForTimeout(1200);
    await userPage.reload();
    await expect(userPage.getByLabel("Full Name")).toHaveValue(updatedName);

    await userPage.goto(gotoApp("/user/shops"));
    await userPage.getByRole("button", { name: "Use my location" }).click();
    await expect(userPage.getByText("Synly Live Test Center", { exact: true })).toBeVisible({ timeout: 20000 });
    await userPage.waitForTimeout(1200);

    await vendorPage.goto(gotoApp("/dashboard/requests"));
    await expect(vendorPage.getByRole("heading", { name: "Requests Management" })).toBeVisible();
    await expect(vendorPage.getByText("Loading request queue…")).toHaveCount(0);

    await userPage.goto(gotoApp("/user/requests"));
    await userPage.getByRole("button", { name: "New Request" }).click();
    await userPage.getByRole("combobox", { name: "Service type" }).click();
    await userPage.getByRole("option", { name: "Towing / roadside help" }).click();
    await userPage.getByLabel("Describe the issue").fill(currentFixture.requestDescription);
    await userPage.getByLabel("Latitude").fill("30.0444");
    await userPage.getByLabel("Longitude").fill("31.2357");
    await userPage.getByRole("button", { name: "Send request" }).click();
    await expect(userPage.getByText("Your service request was sent.")).toBeVisible();
    await userPage.waitForTimeout(1200);
    const customerRequestCard = userPage.locator("div.glass-card").filter({ hasText: currentFixture.requestDescription });
    await expect(customerRequestCard).toBeVisible();
    await expect(customerRequestCard.getByText("pending", { exact: true })).toBeVisible();

    await userPage.goto(gotoApp("/user"));
    await expect(userPage.getByText("Active request", { exact: true })).toBeVisible();
    await expect(userPage.getByText(/towing · pending/i)).toBeVisible();
    await userPage.goto(gotoApp("/user/requests"));
    const incomingOfferCard = userPage.locator("div.glass-card").filter({ hasText: currentFixture.requestDescription });
    await expect(incomingOfferCard.getByText("pending", { exact: true })).toBeVisible();

    await expect(vendorPage.getByText(currentFixture.requestDescription, { exact: true })).toBeVisible({ timeout: 20000 });
    await vendorPage.waitForTimeout(1200);
    const vendorRequestCard = vendorPage.locator("div.glass-card").filter({ hasText: currentFixture.requestDescription });
    await expect(vendorRequestCard).toBeVisible();
    await vendorRequestCard.getByRole("button", { name: "Send offer" }).click();
    const offerDialog = vendorPage.getByRole("dialog");
    await offerDialog.getByLabel("Offer price (EGP)").fill("450");
    await offerDialog.getByLabel("Estimated arrival (minutes)").fill("35");
    await offerDialog.getByRole("button", { name: "Send offer" }).click();
    await expect(vendorPage.getByText("Your offer was sent to the customer.")).toBeVisible();
    await vendorPage.waitForTimeout(1200);

    await expect(incomingOfferCard.getByText("EGP 450.00")).toBeVisible({ timeout: 20000 });
    await incomingOfferCard.getByRole("button", { name: "Accept offer" }).click();
    await expect(userPage.getByText("Offer accepted. The service center has been assigned.")).toBeVisible();
    await userPage.waitForTimeout(1200);
    await expect(incomingOfferCard.getByText("accepted", { exact: true })).toHaveCount(2);
    await expect(vendorRequestCard.getByText("accepted", { exact: true })).toHaveCount(2, { timeout: 20000 });

    await vendorRequestCard.getByRole("button", { name: "Start job" }).click();
    await expect(userPage.getByText("in progress", { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(vendorRequestCard.getByText("in progress", { exact: true })).toBeVisible();

    const session = await userPage.evaluate(() => {
      const storageKey = Object.keys(window.localStorage).find((key) => key.endsWith("-auth-token"));
      if (!storageKey) throw new Error("Supabase browser session storage was not found.");
      const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (!value?.access_token || !value?.refresh_token) throw new Error("Supabase browser session is incomplete.");
      return { accessToken: value.access_token as string, refreshToken: value.refresh_token as string };
    });
    const customerClient = await getCustomerRlsClient(session.accessToken, session.refreshToken);
    const { data: requestRows, error: requestReadError } = await currentFixture.admin
      .from("service_requests")
      .select("id")
      .eq("customer_id", currentFixture.customer.id)
      .eq("description", currentFixture.requestDescription)
      .single();
    expect(requestReadError, "The test request should be identifiable for the RLS-scoped audit assertion").toBeNull();
    const { data: auditEvents, error: auditError } = await customerClient
      .from("request_status_events")
      .select("from_status,to_status")
      .eq("request_id", requestRows!.id)
      .order("created_at");
    expect(auditError, "The customer should be allowed to read their request audit events").toBeNull();
    const transitions = auditEvents?.map((event) => event.to_status) ?? [];
    expect(transitions, "The append-only audit trail should record request creation, offer, acceptance, and job start").toEqual(expect.arrayContaining(["pending", "offered", "accepted", "in_progress"]));
  } finally {
    await Promise.allSettled([userContext.close(), vendorContext.close()]);
    const userVideoPath = await userVideo?.path();
    const vendorVideoPath = await vendorVideo?.path();
    if (userVideoPath) await rename(userVideoPath, resolve(videoDirectory, "user-flow.webm"));
    if (vendorVideoPath) await rename(vendorVideoPath, resolve(videoDirectory, "vendor-flow.webm"));
  }
});
