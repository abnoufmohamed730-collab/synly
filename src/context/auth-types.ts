export type AppMode = "user" | "vendor";
export type Role = "user" | "vendor" | "admin";

export interface User {
  id: string;
  email: string;
  businessName: string;
  serviceType: string;
  description?: string;
  location: string;
  operatingHours: string;
  status: "online" | "offline";
  verified: boolean;
  role: Role;
  username?: string;
  phone?: string;
  carModel?: string;
  plateNumber?: string;
  yearOfManufacture?: string;
  transmission?: string;
  fuelType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  phoneNumbers?: string | string[];
  emergencyLine?: string;
  paymentMethods?: string[];
  socialFacebook?: string;
  socialWhatsApp?: string;
  socialInstagram?: string;
}

export interface RegisterData {
  role: "user" | "vendor";
  username: string;
  email: string;
  password: string;
  phone: string;
  locale?: string;
  carModel?: string;
  plateNumber?: string;
  yearOfManufacture?: string;
  transmission?: string;
  fuelType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  carLicenseFile?: File | null;
  personalIdFile?: File | null;
  businessName?: string;
  serviceType?: string;
  phoneNumbers?: string | string[];
  emergencyLine?: string;
  location?: string;
  coordinates?: { lat: number; lng: number } | null;
  commercialRegisterFile?: File | null;
  taxIdFile?: File | null;
  workingHours?: string;
  paymentMethods?: string[];
  socialFacebook?: string;
  socialWhatsApp?: string;
  socialInstagram?: string;
}

export interface AuthContextType {
  user: User | null;
  role: Role;
  activeMode: AppMode;
  mode: AppMode;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  switchMode: (newMode: AppMode) => Promise<void>;
  setMode: (newMode: AppMode) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
}
