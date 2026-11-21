import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  createAdminClient,
  generateSixDigitOtp,
  getRequiredSecret,
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
  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: [{ type: "body", parameters: [{ type: "text", text: otp }] }],
      },
    }),
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
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
  if (!isE164(phone) || (channel !== "whatsapp" && channel !== "sms")) {
    return jsonResponse({ error: "Enter a valid E.164 phone number and delivery channel." }, 400);
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();
  if (profileError) {
    console.error("send-otp profile lookup failed");
    return jsonResponse(genericResponse, 202);
  }
  if (!profile?.user_id) return jsonResponse(genericResponse, 202);

  try {
    const otp = generateSixDigitOtp();
    const secret = getRequiredSecret("OTP_HASH_SECRET");
    const otpHash = await hashValue(`${phone}:${otp}:${secret}`);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insertError } = await admin.from("password_reset_otps").insert({
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
    });
    if (insertError) throw new Error("OTP storage failed");

    if (channel === "whatsapp") await sendWhatsApp(phone, otp);
    else await sendSms(phone, otp);
  } catch {
    // Keep the response identical so delivery configuration cannot reveal account existence.
    console.error("send-otp processing or delivery failed");
  }

  return jsonResponse(genericResponse, 202);
});
