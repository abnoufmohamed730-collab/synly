import type { RegisterFormData } from "../types/register";
import type { Role } from "../context/auth-context";

export function validateRegisterStep(
  step: number,
  role: Role | null,
  data: RegisterFormData,
  t: (key: string) => string
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 0) {
    if (!role) {
      errors.role = t("register.errorRole");
    }
  }

  if (step === 1) {
    if (!data.username.trim()) errors.username = t("register.errorRequired");
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = t("register.errorEmail");
    if (data.password.length < 6) errors.password = t("register.errorPassword");
    if (!data.phone.trim() || data.phone.replace(/\D/g, "").length < 8)
      errors.phone = t("register.errorPhone");
  }

  if (step === 2) {
    if (role === "user") {
      if (!data.carModel.trim()) errors.carModel = t("register.errorRequired");
      if (!data.plateNumber.trim()) errors.plateNumber = t("register.errorRequired");
      if (!data.year) errors.year = t("register.errorRequired");
      if (!data.transmission) errors.transmission = t("register.errorRequired");
      if (!data.fuelType) errors.fuelType = t("register.errorRequired");
      if (!data.emergencyName.trim()) errors.emergencyName = t("register.errorRequired");
      if (!data.emergencyPhone.trim() || data.emergencyPhone.replace(/\D/g, "").length < 8)
        errors.emergencyPhone = t("register.errorPhone");
      if (!data.carLicenseFile) errors.carLicenseFile = t("register.errorFile");
      if (!data.personalIdFile) errors.personalIdFile = t("register.errorFile");
    } else {
      if (!data.businessName.trim()) errors.businessName = t("register.errorRequired");
      if (!data.serviceType) errors.serviceType = t("register.errorRequired");
      if (!data.phoneNumbers.trim()) errors.phoneNumbers = t("register.errorRequired");
      if (!data.emergencyLine.trim()) errors.emergencyLine = t("register.errorRequired");
      if (!data.coordinates) errors.coordinates = t("register.errorRequired");
      if (!data.commercialRegisterFile) errors.commercialRegisterFile = t("register.errorFile");
      if (!data.taxIdFile) errors.taxIdFile = t("register.errorFile");
      if (!data.workingHours.trim()) errors.workingHours = t("register.errorRequired");
      if (data.paymentMethodsSelected.length === 0)
        errors.paymentMethods = t("register.errorRequired");
    }
  }

  return errors;
}
