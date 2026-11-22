import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  createAdminClient,
  generateSixDigitOtp,
  getRequiredSecret,
  hasRequiredSecrets,
  handleOptions,
  hashValue,
  isE164,
  jsonResponse,
  parseJson,
} from "../_shared/http.ts";

const genericResponse = { ok: true, message: "If an account matches that number, a verification code will be sent." };

async function sendWhatsApp(phone: string, otp: string): Promise<void> {
  const token = getRequiredSecret("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = getRequiredSecret("WHATSAPP_PHONE_NUMBER_ID");
  const template = getRequiredSecret("WHATSAPP_OTP_TEMPLATE");
  const response = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "template", template: { name: template, language: { code: "en" }, components: [{ type: "body", parameters: [{ type: "text", text: otp }] }] } }),
  });
  if (!response.ok) throw new Error("WhatsApp delivery failed");
}

async function sendSms(phone: string, otp: string): Promise<void> {
  const sid = getRequiredSecret("SMS_PROVIDER_SID");
  const token = getRequiredSecret("SMS_PROVIDER_TOKEN");
  const from = getRequiredSecret("SMS_FROM_NUMBER");
  const body = new URLSearchParams({ To: phone, From: from, Body: `Your Synly verification code is ${otp}. It expires in 5 minutes.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("SMS delivery failed");
}

serve(async (request) => {
  const preflight = handleOptions(request);
  if (preflight) return preflight;
  const payload = await parseJson(request);
  const phone = typeof payload?.phone === "string" ? payload.phone.trim() : "";
  const channel = payload?.channel;
  if (!isE164(phone) || (channel !== "whatsapp" && channel !== "sms")) return jsonResponse({ error: "Enter a valid E.164 phone number and delivery channel." }, request, 400);
  if (!hasRequiredSecrets(["OTP_HASH_SECRET"])) return jsonResponse({ error: "Password recovery is temporarily unavailable." }, request, 503);
  const providerSecrets = channel === "whatsapp"
    ? ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_OTP_TEMPLATE"]
    : ["SMS_PROVIDER_SID", "SMS_PROVIDER_TOKEN", "SMS_FROM_NUMBER"];
  if (!hasRequiredSecrets(providerSecrets)) return jsonResponse({ error: `${channel === "whatsapp" ? "WhatsApp" : "SMS"} delivery is not configured.` }, request, 503);

  try {
    const admin = createAdminClient();
    const { data: reserved, error: limitError } = await admin.rpc("reserve_password_reset_otp", { p_phone_e164: phone });
    if (limitError) throw new Error("OTP rate limit reservation failed");
    if (!reserved) return jsonResponse({ error: "Please wait before requesting another code.", code: "cooldown", retryAfter: 60 }, request, 429, { "Retry-After": "60" });

    const { data: profile, error: profileError } = await admin.from("profiles").select("user_id").eq("phone_e164", phone).maybeSingle();
    if (profileError || !profile?.user_id) return jsonResponse(genericResponse, request, 202);

    const otp = generateSixDigitOtp();
    const otpHash = await hashValue(`${phone}:${otp}:${getRequiredSecret("OTP_HASH_SECRET")}`);
    const { error: invalidateError } = await admin.from("password_reset_otps").update({ used_at: new Date().toISOString() }).eq("phone_e164", phone).is("used_at", null);
    if (invalidateError) throw new Error("Could not invalidate prior OTPs");
    const { error: insertError } = await admin.from("password_reset_otps").insert({ phone_e164: phone, otp_hash: otpHash, expires_at: new Date(Date.now() + 5 * 60_000).toISOString() });
    if (insertError) throw new Error("OTP storage failed");
    const delivery = (channel === "whatsapp" ? sendWhatsApp(phone, otp) : sendSms(phone, otp)).catch(() => {
      console.error("[send-otp] OTP provider delivery failed");
    });
    const edgeRuntime = (globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil(promise: Promise<void>): void } }).EdgeRuntime;
    if (edgeRuntime) edgeRuntime.waitUntil(delivery);
    else void delivery;
    return jsonResponse(genericResponse, request, 202);
  } catch {
    console.error("[send-otp] OTP processing failed");
    return jsonResponse({ error: "Password recovery is temporarily unavailable.", code: "service_unavailable" }, request, 503);
  }
});
