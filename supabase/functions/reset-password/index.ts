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
  if (password.length < 8 || password.length > 128) return false;
  const classes = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  return classes.filter(Boolean).length >= 3;
}

serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const payload = await parseJson(request);
  const token = typeof payload?.resetToken === "string" ? payload.resetToken.trim() : "";
  const password = typeof payload?.newPassword === "string" ? payload.newPassword : "";
  if (!/^[a-f0-9]{64}$/i.test(token) || !isStrongPassword(password)) {
    return jsonResponse({ error: "A valid reset token and a strong password are required." }, 400);
  }

  try {
    const admin = createAdminClient();
    const secret = getRequiredSecret("OTP_HASH_SECRET");
    const tokenHash = await hashValue(`${token}:${secret}`);
    const now = new Date().toISOString();
    const { data: tokenRecord, error: tokenLookupError } = await admin
      .from("password_reset_tokens")
      .select("id, phone")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", now)
      .maybeSingle();
    if (tokenLookupError) throw new Error("Reset token lookup failed");
    if (!tokenRecord) return jsonResponse({ error: "Reset token is invalid or expired." }, 400);

    // Claim the token atomically before changing credentials to prevent concurrent reuse.
    const { data: claimed, error: claimError } = await admin
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();
    if (claimError || !claimed) return jsonResponse({ error: "Reset token is invalid or expired." }, 400);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("user_id")
      .eq("phone", tokenRecord.phone)
      .limit(1)
      .maybeSingle();
    if (profileError) throw new Error("Profile lookup failed");
    if (!profile?.user_id) return jsonResponse({ error: "Unable to reset password for this account." }, 400);

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.user_id, { password });
    if (updateError) throw new Error("Auth password update failed");

    return jsonResponse({ ok: true, message: "Password updated successfully." });
  } catch {
    console.error("reset-password processing failed");
    return jsonResponse({ error: "Unable to reset password right now." }, 500);
  }
});
