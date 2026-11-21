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
  if (!isE164(phone) || !isSixDigitOtp(otp)) {
    return jsonResponse({ error: "Invalid phone number or OTP format." }, 400);
  }

  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data: record, error: findError } = await admin
      .from("password_reset_otps")
      .select("id, otp_hash, expires_at, attempts")
      .eq("phone", phone)
      .is("used_at", null)
      .gt("expires_at", now)
      .lt("attempts", 5)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw new Error("OTP lookup failed");
    if (!record) return jsonResponse({ error: "Verification code is invalid or expired." }, 400);

    const secret = getRequiredSecret("OTP_HASH_SECRET");
    const candidateHash = await hashValue(`${phone}:${otp}:${secret}`);
    if (candidateHash !== record.otp_hash) {
      const { data: updated, error: attemptError } = await admin
        .from("password_reset_otps")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id)
        .eq("attempts", record.attempts)
        .is("used_at", null)
        .select("id")
        .maybeSingle();
      if (attemptError || !updated) throw new Error("OTP attempt update failed");
      return jsonResponse({ error: "Invalid verification code." }, 400);
    }

    const { data: consumed, error: consumeError } = await admin
      .from("password_reset_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id)
      .eq("attempts", record.attempts)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();
    if (consumeError || !consumed) {
      return jsonResponse({ error: "Verification code is invalid or expired." }, 400);
    }

    const resetToken = generateResetToken();
    const tokenHash = await hashValue(`${resetToken}:${secret}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await admin.from("password_reset_tokens").insert({
      phone,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    if (insertError) throw new Error("Reset token storage failed");

    return jsonResponse({ ok: true, resetToken });
  } catch {
    console.error("verify-otp processing failed");
    return jsonResponse({ error: "Unable to verify code right now." }, 500);
  }
});
