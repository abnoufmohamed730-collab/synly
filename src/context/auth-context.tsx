import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  businessName: string;
  serviceType: string;
  location: string;
  operatingHours: string;
  status: "online" | "offline";
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

interface RegisterData {
  businessName: string;
  email: string;
  password: string;
  serviceType: string;
  commercialRegister: string;
  location: string;
  operatingHours: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email && password) {
      setUser({
        id: "1",
        email,
        businessName: "AutoCare Pro Center",
        serviceType: "Mechanical Repair",
        location: "Downtown, Cairo",
        operatingHours: "8:00 AM - 10:00 PM",
        status: "online",
        verified: true,
      });
    } else {
      throw new Error("Invalid credentials");
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setUser({
      id: "1",
      email: data.email,
      businessName: data.businessName,
      serviceType: data.serviceType,
      location: data.location,
      operatingHours: data.operatingHours,
      status: "online",
      verified: false,
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}