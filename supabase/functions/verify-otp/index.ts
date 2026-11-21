import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  createAdminClient,
  generateResetToken,
  getRequiredSecret,
  handleOptions,
  hashValue,
  isE164,
  isSixDigitOtp,
  jsonResponse,
  parseJson,
} from "../_shared/http.ts";

serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;
  const payload = await parseJson(request);
  const phone = typeof payload?.phone === "string" ? payload.phone.trim() : "";
  const otp = typeof payload?.otp === "string" ? payload.otp.trim() : "";
  if (!isE164(phone) || !isSixDigitOtp(otp)) return jsonResponse({ error: "Invalid phone number or OTP format." }, request, 400);

  try {
    const admin = createAdminClient();
    const secret = getRequiredSecret("OTP_HASH_SECRET");
    const candidateHash = await hashValue(`${phone}:${otp}:${secret}`);
    const { data: valid, error: consumeError } = await admin.rpc("consume_password_reset_otp", { p_phone_e164: phone, p_candidate_hash: candidateHash });
    if (consumeError) throw new Error("OTP verification failed");
    if (!valid) return jsonResponse({ error: "Verification code is invalid or expired." }, request, 400);

    const resetToken = generateResetToken();
    const tokenHash = await hashValue(`${resetToken}:${secret}`);
    const { error: insertError } = await admin.from("password_reset_tokens").insert({ phone_e164: phone, token_hash: tokenHash, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
    if (insertError) throw new Error("Reset token storage failed");
    return jsonResponse({ ok: true, resetToken }, request);
  } catch {
    console.error("[verify-otp] OTP verification processing failed");
    return jsonResponse({ error: "Unable to verify code right now." }, request, 500);
  }
});
