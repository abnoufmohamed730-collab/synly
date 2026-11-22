import { expect, test } from "@playwright/test";

 test("complete password recovery with mocked OTP edge functions", async ({ page }) => {
  await page.route("**/functions/v1/send-otp", (route) => route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route("**/functions/v1/verify-otp", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ resetToken: "a".repeat(64) }) }));
  await page.route("**/functions/v1/reset-password", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));

  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByLabel("Phone number").fill("+201001234567");
  await page.getByRole("button", { name: "SMS" }).click();
  await page.getByRole("button", { name: "Send verification code" }).click();

  await expect(page.getByRole("heading", { name: "Check your phone" })).toBeVisible();
  const digits = page.getByRole("textbox", { name: /^Code digit/ });
  for (const [index, digit] of "123456".split("").entries()) await digits.nth(index).fill(digit);
  await page.getByRole("button", { name: "Verify code" }).click();

  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  await page.getByRole("textbox", { name: "New password", exact: true }).fill("StrongPass123!");
  await page.getByRole("textbox", { name: "Confirm new password", exact: true }).fill("StrongPass123!");
  await page.getByRole("button", { name: "Save new password" }).click();

  await expect(page.getByRole("heading", { name: "Password reset complete" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in now" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
