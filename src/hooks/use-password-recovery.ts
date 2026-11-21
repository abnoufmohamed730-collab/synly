import { useCallback, useEffect, useState } from "react";
import {
  OTP_LIFETIME_SECONDS,
  passwordRecoveryService,
  type DeliveryChannel,
  type OtpChallenge,
} from "../services/password-recovery-service";

export type RecoveryStep = "phone" | "otp" | "password" | "complete";

type RecoveryError = "phone-invalid" | "otp-invalid" | "otp-expired" | "password-mismatch" | "password-too-short" | "request-failed";

export function usePasswordRecovery() {
  const [step, setStep] = useState<RecoveryStep>("phone");
  const [phone, setPhone] = useState("+20");
  const [channel, setChannel] = useState<DeliveryChannel>("whatsapp");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(OTP_LIFETIME_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RecoveryError | null>(null);

  useEffect(() => {
    if (step !== "otp" || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, remainingSeconds]);

  const requestCode = useCallback(async (nextChannel = channel) => {
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
      setError("phone-invalid");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const nextChallenge = await passwordRecoveryService.requestOtp(normalizedPhone, nextChannel);
      setChallenge(nextChallenge);
      setChannel(nextChannel);
      setRemainingSeconds(OTP_LIFETIME_SECONDS);
      setStep("otp");
      return nextChallenge;
    } catch {
      setError("request-failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [channel, phone]);

  const verifyCode = useCallback(async (code: string) => {
    if (!challenge) return false;
    setLoading(true);
    setError(null);
    try {
      await passwordRecoveryService.verifyOtp(challenge, code);
      setStep("password");
      return true;
    } catch (failure) {
      setError(failure instanceof Error && failure.message === "otp-expired" ? "otp-expired" : "otp-invalid");
      return false;
    } finally {
      setLoading(false);
    }
  }, [challenge]);

  const resetPassword = useCallback(async (password: string, confirmation: string) => {
    if (password.length < 8) {
      setError("password-too-short");
      return false;
    }
    if (password !== confirmation) {
      setError("password-mismatch");
      return false;
    }
    if (!challenge) return false;
    setLoading(true);
    setError(null);
    try {
      await passwordRecoveryService.resetPassword(challenge.phone, password);
      setStep("complete");
      return true;
    } catch {
      setError("request-failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [challenge]);

  return {
    step,
    phone,
    setPhone,
    channel,
    setChannel,
    challenge,
    remainingSeconds,
    loading,
    error,
    setError,
    requestCode,
    verifyCode,
    resetPassword,
    backToPhone: () => {
      setStep("phone");
      setError(null);
    },
  };
}
