import { expect, test } from "@playwright/test";

test("complete the password recovery flow with the demo OTP", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();

  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByLabel("Phone number").fill("+201001234567");
  await page.getByRole("button", { name: "SMS" }).click();
  await page.getByRole("button", { name: "Send verification code" }).click();

  await expect(page.getByRole("heading", { name: "Check your phone" })).toBeVisible();
  await expect(page.getByText("Demo code: 246810")).toBeVisible();
  const codeDigits = page.getByRole("textbox", { name: /^Code digit/ });
  for (let index = 0; index < 6; index += 1) {
    await codeDigits.nth(index).fill(String("246810"[index]));
  }
  await page.getByRole("button", { name: "Verify code" }).click();

  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  await page.getByRole("textbox", { name: "New password", exact: true }).fill("StrongPass123!");
  await page.getByRole("textbox", { name: "Confirm new password", exact: true }).fill("StrongPass123!");
  await page.getByRole("button", { name: "Save new password" }).click();

  await expect(page.getByRole("heading", { name: "Password reset complete" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in now" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
