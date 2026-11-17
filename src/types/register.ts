import type { Role } from "../context/auth-context";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RegisterFormData {
  // Account fields (both roles)
  username: string;
  email: string;
  password: string;
  phone: string;

  // Car owner fields
  carModel: string;
  plateNumber: string;
  year: string;
  transmission: string;
  fuelType: string;
  emergencyName: string;
  emergencyPhone: string;
  carLicenseFile: File | null;
  personalIdFile: File | null;

  // Vendor fields
  businessName: string;
  serviceType: string;
  phoneNumbers: string;
  emergencyLine: string;
  coordinates: Coordinates | null;
  commercialRegisterFile: File | null;
  taxIdFile: File | null;
  workingHours: string;
  paymentMethodsSelected: string[];
  socialFacebook: string;
  socialWhatsApp: string;
  socialInstagram: string;
}

export const initialRegisterFormData: RegisterFormData = {
  username: "",
  email: "",
  password: "",
  phone: "",
  carModel: "",
  plateNumber: "",
  year: "",
  transmission: "",
  fuelType: "",
  emergencyName: "",
  emergencyPhone: "",
  carLicenseFile: null,
  personalIdFile: null,
  businessName: "",
  serviceType: "",
  phoneNumbers: "",
  emergencyLine: "",
  coordinates: null,
  commercialRegisterFile: null,
  taxIdFile: null,
  workingHours: "",
  paymentMethodsSelected: [],
  socialFacebook: "",
  socialWhatsApp: "",
  socialInstagram: "",
};

export type UpdateField = <K extends keyof RegisterFormData>(
  field: K,
  value: RegisterFormData[K]
) => void;

export type RegisterErrors = Record<string, string>;

export type { Role };
