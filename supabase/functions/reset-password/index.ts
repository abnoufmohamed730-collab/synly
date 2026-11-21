import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  createAdminClient,
  getRequiredSecret,
  handleOptions,
  hashValue,
  jsonResponse,
  parseJson,
} from "../_shared/http.ts";

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128 && [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length >= 3;
}

serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;
  const payload = await parseJson(request);
  const token = typeof payload?.resetToken === "string" ? payload.resetToken.trim() : "";
  const password = typeof payload?.newPassword === "string" ? payload.newPassword : "";
  if (!/^[a-f0-9]{64}$/i.test(token) || !isStrongPassword(password)) return jsonResponse({ error: "A valid reset token and a strong password are required." }, request, 400);

  try {
    const admin = createAdminClient();
    const tokenHash = await hashValue(`${token}:${getRequiredSecret("OTP_HASH_SECRET")}`);
    const { data: record, error: lookupError } = await admin.from("password_reset_tokens").select("id,phone_e164").eq("token_hash", tokenHash).is("used_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (lookupError) throw new Error("Reset token lookup failed");
    if (!record) return jsonResponse({ error: "Reset token is invalid or expired." }, request, 400);

    const { data: claimed, error: claimError } = await admin.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", record.id).is("used_at", null).gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
    if (claimError || !claimed) return jsonResponse({ error: "Reset token is invalid or expired." }, request, 400);
    const { data: profile, error: profileError } = await admin.from("profiles").select("user_id").eq("phone_e164", record.phone_e164).maybeSingle();
    if (profileError || !profile?.user_id) throw new Error("Reset account lookup failed");
    const { error: updateError } = await admin.auth.admin.updateUserById(profile.user_id, { password });
    if (updateError) throw new Error("Password update failed");
    await admin.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("phone_e164", record.phone_e164).is("used_at", null);
    await admin.from("notifications").insert({ user_id: profile.user_id, event_type: "password_reset", title: "Password changed", message: "Your Synly password was changed. If this was not you, contact support." });
    return jsonResponse({ ok: true, message: "Password updated successfully." }, request);
  } catch {
    console.error("[reset-password] Password reset processing failed");
    return jsonResponse({ error: "Unable to reset password right now." }, request, 500);
  }
});
