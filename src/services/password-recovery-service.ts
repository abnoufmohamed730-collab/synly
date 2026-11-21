import { supabase } from "../integrations/supabase/client";

export type DeliveryChannel = "whatsapp" | "sms";

export interface OtpChallenge {
  phone: string;
  channel: DeliveryChannel;
  expiresAt: number;
  resetToken?: string;
}

const OTP_LIFETIME_SECONDS = 300;

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The recovery service returned no response.");
  if (typeof data === "object" && "error" in data && typeof data.error === "string") throw new Error(data.error);
  return data;
}

export const passwordRecoveryService = {
  async requestOtp(phone: string, channel: DeliveryChannel): Promise<OtpChallenge> {
    await invoke("send-otp", { phone, channel });
    return { phone, channel, expiresAt: Date.now() + OTP_LIFETIME_SECONDS * 1000 };
  },

  async verifyOtp(challenge: OtpChallenge, otp: string): Promise<OtpChallenge> {
    const result = await invoke<{ resetToken: string }>("verify-otp", { phone: challenge.phone, otp });
    return { ...challenge, resetToken: result.resetToken };
  },

  async resetPassword(challenge: OtpChallenge, newPassword: string): Promise<void> {
    if (!challenge.resetToken) throw new Error("Verify the code before resetting your password.");
    await invoke("reset-password", { resetToken: challenge.resetToken, newPassword });
  },
};

export const OTP_LIFETIME_SECONDS_CLIENT = OTP_LIFETIME_SECONDS;
