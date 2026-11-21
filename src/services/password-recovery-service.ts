export type DeliveryChannel = "whatsapp" | "sms";

export interface OtpChallenge {
  phone: string;
  channel: DeliveryChannel;
  expiresAt: number;
  demoCode: string;
}

export interface PasswordRecoveryService {
  requestOtp(phone: string, channel: DeliveryChannel): Promise<OtpChallenge>;
  verifyOtp(challenge: OtpChallenge, code: string): Promise<void>;
  resetPassword(phone: string, newPassword: string): Promise<void>;
}

const DEMO_OTP = "246810";
const OTP_LIFETIME_MS = 60_000;

const delay = () => new Promise<void>((resolve) => window.setTimeout(resolve, 500));

export const passwordRecoveryService: PasswordRecoveryService = {
  async requestOtp(phone, channel) {
    await delay();
    return {
      phone,
      channel,
      expiresAt: Date.now() + OTP_LIFETIME_MS,
      demoCode: DEMO_OTP,
    };
  },

  async verifyOtp(challenge, code) {
    await delay();
    if (Date.now() > challenge.expiresAt) {
      throw new Error("otp-expired");
    }
    if (code !== challenge.demoCode) {
      throw new Error("otp-invalid");
    }
  },

  async resetPassword(_phone, newPassword) {
    await delay();
    if (newPassword.length < 8) throw new Error("password-too-short");
  },
};

export const OTP_LIFETIME_SECONDS = OTP_LIFETIME_MS / 1000;
