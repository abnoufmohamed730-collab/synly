import { expect, test } from "@playwright/test";

test("create and cancel a service request", async ({ page }) => {
  const email = process.env.DYAD_TEST_USER_EMAIL;
  const password = process.env.DYAD_TEST_USER_PASSWORD;
  expect(email, "Dyad should provide an isolated Supabase test email").toBeTruthy();
  expect(password, "Dyad should provide an isolated Supabase test password").toBeTruthy();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/user$/);

  await page.goto("/user/requests");
  await page.getByRole("button", { name: "New Request" }).click();
  await page.getByLabel("Describe the issue").fill("Playwright test: roadside battery service");
  await page.getByLabel("Latitude").fill("30.0444");
  await page.getByLabel("Longitude").fill("31.2357");
  await page.getByRole("button", { name: "Send request" }).click();

  await expect(page.getByText("Your service request was sent.")).toBeVisible();
  const requestCard = page.locator("div.glass-card").filter({ hasText: "Playwright test: roadside battery service" });
  await expect(requestCard).toBeVisible();
  await requestCard.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Request cancelled.")).toBeVisible();
  await expect(requestCard.getByText("cancelled")).toBeVisible();
});
