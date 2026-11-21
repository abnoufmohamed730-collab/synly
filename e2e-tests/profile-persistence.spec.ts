import { expect, test } from "@playwright/test";

test("save and reload user profile and vehicle details", async ({ page }) => {
  const email = process.env.DYAD_TEST_USER_EMAIL;
  const password = process.env.DYAD_TEST_USER_PASSWORD;
  expect(email, "Dyad should provide an isolated Supabase test email").toBeTruthy();
  expect(password, "Dyad should provide an isolated Supabase test password").toBeTruthy();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/user$/);

  await page.goto("/user/profile");
  await expect(page.getByLabel("Full Name")).toBeVisible();
  const unique = Date.now().toString();
  const fullName = `Profile Test ${unique}`;
  const phone = `+1555${unique.slice(-7)}`;
  const plate = `T${unique.slice(-6)}`;
  const emergencyPhone = `+1666${unique.slice(-7)}`;

  await page.getByLabel("Full Name").fill(fullName);
  await page.getByLabel("Phone", { exact: true }).fill(phone);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile updated successfully.")).toBeVisible();

  await page.getByLabel("Car Model").fill("Synly Test Sedan");
  await page.getByLabel("Plate Number").fill(plate);
  await page.getByLabel("Emergency Contact").fill("Test Contact");
  await page.getByLabel("Emergency Phone").fill(emergencyPhone);
  await page.getByRole("button", { name: "Save Vehicle" }).click();
  await expect(page.getByText("Vehicle and emergency contact saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Full Name")).toHaveValue(fullName);
  await expect(page.getByLabel("Phone", { exact: true })).toHaveValue(phone);
  await expect(page.getByLabel("Car Model")).toHaveValue("Synly Test Sedan");
  await expect(page.getByLabel("Plate Number")).toHaveValue(plate);
  await expect(page.getByLabel("Emergency Contact")).toHaveValue("Test Contact");
  await expect(page.getByLabel("Emergency Phone")).toHaveValue(emergencyPhone);
});
