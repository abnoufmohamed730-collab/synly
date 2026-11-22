import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AppMode, AuthContextType, RegisterData, Role, User } from "./auth-types";
import { supabase } from "../integrations/supabase/client";
import { readStoredMode, writeStoredMode } from "./auth-session";
import { buildSignupMetadata, fetchProfileSnapshot, mapSnapshotToUser } from "../services/profile-service";
import { normalizeE164 } from "../lib/phone";
import { useLanguage } from "./language-context";

export type { AppMode, AuthContextType, RegisterData, Role, User } from "./auth-types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLang } = useLanguage();
  const lastHydratedUserId = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeMode, setActiveMode] = useState<AppMode>(readStoredMode());
  const [isLoading, setIsLoading] = useState(true);

  const hydrateUser = useCallback(async (authUser: { id: string; email?: string } | null): Promise<User | null> => {
    if (!authUser) {
      lastHydratedUserId.current = null;
      setUser(null);
      setActiveMode("user");
      writeStoredMode("user");
      setIsLoading(false);
      return null;
    }

    try {
      const snapshot = await fetchProfileSnapshot(authUser.id);
      const nextUser = mapSnapshotToUser(snapshot, authUser);
      lastHydratedUserId.current = authUser.id;
      setUser(nextUser);
      if (snapshot.profile.locale === "ar" || snapshot.profile.locale === "en") setLang(snapshot.profile.locale);
      setActiveMode((current) => {
        const next = nextUser.role === "vendor" ? current : "user";
        writeStoredMode(next);
        return next;
      });
      return nextUser;
    } catch (error) {
      // Preserve existing user state on transient network errors during hydration;
      // only clear when the session itself is invalid (actual auth failure).
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const isAuthFailure = message.includes("jwt") || message.includes("token") || message.includes("session") || message.includes("auth") || message.includes("expired");
      if (isAuthFailure) {
        lastHydratedUserId.current = null;
        setUser(null);
        setActiveMode("user");
        writeStoredMode("user");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setLang]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore TOKEN_REFRESHED noise safely
      if (event === "TOKEN_REFRESHED") return;

      const sessionUser = session?.user ?? null;

      // Avoid double hydration on login: if we already hydrated this user, skip
      if (sessionUser && sessionUser.id === lastHydratedUserId.current) return;

      // Use setTimeout(..., 0) for hydration to avoid blocking the callback
      window.setTimeout(() => {
        // Double-check after timeout to avoid race conditions
        if (sessionUser && sessionUser.id === lastHydratedUserId.current) return;
        void hydrateUser(sessionUser).catch(() => undefined);
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, [hydrateUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    try {
      const nextUser = await hydrateUser(data.user);
      if (!nextUser) throw new Error("Could not load your account profile.");
      return nextUser;
    } catch (profileError) {
      setIsLoading(false);
      throw profileError;
    }
  }, [hydrateUser]);

  const register = useCallback(async (data: RegisterData) => {
    const phone = normalizeE164(data.phone);
    const emergencyPhone = data.emergencyContactPhone ? normalizeE164(data.emergencyContactPhone) : null;
    const centerPhone = data.phoneNumbers ? normalizeE164(String(data.phoneNumbers).split(/[;,]/)[0]) : phone;
    const emergencyLine = data.emergencyLine ? normalizeE164(data.emergencyLine) : null;
    if (!phone || (data.role === "user" && !emergencyPhone) || (data.role === "vendor" && (!centerPhone || !emergencyLine))) {
      throw new Error("Enter valid phone numbers, including the country code when needed.");
    }
    data = { ...data, phone, emergencyContactPhone: emergencyPhone ?? undefined, phoneNumbers: centerPhone ?? undefined, emergencyLine: emergencyLine ?? undefined };
    setIsLoading(true);
    const callbackUrl = new URL("/auth/callback", window.location.origin).href;
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        emailRedirectTo: callbackUrl,
        data: buildSignupMetadata(data),
      },
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    if (!result.session) {
      setIsLoading(false);
      return { requiresEmailConfirmation: true };
    }
    await hydrateUser(result.user);
    return { requiresEmailConfirmation: false };
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
        if (error) await supabase.auth.signOut({ scope: "local" });
        setUser(null);
    setActiveMode("user");
    writeStoredMode("user");
    setIsLoading(false);
  }, []);

  const switchMode = useCallback(async (newMode: AppMode) => {
    const mode = newMode === "vendor" && user?.role !== "vendor" ? "user" : newMode;
    setActiveMode(mode);
    writeStoredMode(mode);
  }, [user?.role]);

  const updateUserProfile = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error("You must be signed in to update your profile.");

    const profileUpdate: Record<string, string> = {};
    if (data.username !== undefined) profileUpdate.display_name = data.username;
    else if (data.businessName !== undefined && user.role === "user") profileUpdate.display_name = data.businessName;
    if (data.phone !== undefined) {
      const phone = normalizeE164(data.phone);
      if (!phone) throw new Error("Enter a valid phone number.");
      profileUpdate.phone_e164 = phone;
    }

    const requests: PromiseLike<{ error: { message: string } | null }>[] = [];
    if (Object.keys(profileUpdate).length) {
      requests.push(supabase.from("profiles").update(profileUpdate).eq("user_id", user.id));
    }
    if (user.role === "vendor") {
      const centerUpdate: Record<string, unknown> = {};
      if (data.businessName !== undefined) centerUpdate.name = data.businessName;
      if (data.serviceType !== undefined) centerUpdate.service_type = data.serviceType;
      if (data.description !== undefined) centerUpdate.description = data.description;
      if (data.location !== undefined) centerUpdate.address = data.location;
      if (data.status !== undefined) centerUpdate.is_online = data.status === "online";
      if (data.phoneNumbers !== undefined) {
        const phone = normalizeE164(String(data.phoneNumbers).split(/[;,]/)[0] ?? "");
        if (!phone) throw new Error("Enter a valid service center phone number.");
        centerUpdate.phone_e164 = phone;
      }
      if (data.emergencyLine !== undefined) {
        const phone = normalizeE164(data.emergencyLine);
        if (!phone) throw new Error("Enter a valid emergency phone number.");
        centerUpdate.emergency_phone_e164 = phone;
      }
      if (Object.keys(centerUpdate).length) {
        requests.push(supabase.from("service_centers").update(centerUpdate).eq("owner_id", user.id));
      }
      if (data.operatingHours !== undefined) {
        const { data: center, error: centerError } = await supabase.from("service_centers").select("id").eq("owner_id", user.id).single();
        if (centerError) throw new Error(centerError.message);
        requests.push(supabase.from("service_center_hours").update({ hours_text: data.operatingHours }).eq("service_center_id", center.id));
      }
    }
    const results = await Promise.all(requests);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);
    setUser((current) => current ? { ...current, ...data } : current);
  }, [user]);

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    await hydrateUser(data.session?.user ?? null);
  }, [hydrateUser]);

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? "user",
      activeMode,
      mode: activeMode,
      isAuthenticated: Boolean(user) && !isLoading,
      isLoading,
      login,
      register,
      logout,
      switchMode,
      setMode: switchMode,
      updateUserProfile,
      updateUser: updateUserProfile,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export default AuthContext;