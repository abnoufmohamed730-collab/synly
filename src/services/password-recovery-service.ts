import { supabase } from "../integrations/supabase/client";

export type DeliveryChannel = "whatsapp" | "sms";

export interface OtpChallenge {
  phone: string;
  channel: DeliveryChannel;
  expiresAt: number;
  resetToken?: string;
}

export class RecoveryServiceError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string, readonly retryAfter = 0) {
    super(message);
    this.name = "RecoveryServiceError";
  }
}

const OTP_LIFETIME_SECONDS = 300;

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    const response = (error as { context?: Response }).context;
    const status = response?.status ?? 0;
    const retryAfter = Number(response?.headers.get("Retry-After") ?? 0);
    const payload = response ? await response.clone().json().catch(() => null) as { error?: string; code?: string; retryAfter?: number } | null : null;
    throw new RecoveryServiceError(payload?.error ?? error.message, status, payload?.code, payload?.retryAfter ?? retryAfter);
  }
  if (!data) throw new RecoveryServiceError("The recovery service returned no response.", 0);
  if (typeof data === "object" && "error" in data && typeof data.error === "string") throw new RecoveryServiceError(data.error, 400);
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
      // The reset function revokes every session for the account, so drop the local one as well
      // instead of leaving a stale token in the browser.
      await supabase.auth.signOut({ scope: "local" });
    },
};

export const OTP_LIFETIME_SECONDS_CLIENT = OTP_LIFETIME_SECONDS;
