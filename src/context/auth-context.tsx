import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppMode, AuthContextType, RegisterData, Role, SessionInfo, User } from "./auth-types";
import { supabase } from "../integrations/supabase/client";
import { readStoredMode, writeStoredMode } from "./auth-session";
import { buildSignupMetadata, fetchProfileSnapshot, mapSnapshotToUser } from "../services/profile-service";

export type { AppMode, AuthContextType, RegisterData, Role, SessionInfo, User } from "./auth-types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const EMPTY_SESSIONS: SessionInfo[] = [];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeMode, setActiveMode] = useState<AppMode>(readStoredMode());
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateUser = useCallback(async (authUser: { id: string; email?: string } | null, expiresAt?: number | null) => {
    if (!authUser) {
      setUser(null);
      setSessionExpiresAt(null);
      setActiveMode("user");
      writeStoredMode("user");
      setIsLoading(false);
      return;
    }

    try {
      const snapshot = await fetchProfileSnapshot(authUser.id);
      const nextUser = mapSnapshotToUser(snapshot, authUser);
      setUser(nextUser);
      setSessionExpiresAt(expiresAt ?? null);
      setActiveMode((current) => {
        const next = nextUser.role === "vendor" ? current : "user";
        writeStoredMode(next);
        return next;
      });
    } catch {
      setUser(null);
      setSessionExpiresAt(expiresAt ?? null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateUser(session?.user ?? null, session?.expires_at ? session.expires_at * 1000 : null);
    });
    return () => subscription.unsubscribe();
  }, [hydrateUser]);

  const login = useCallback(async (email: string, password: string, _remember = true) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
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
    await hydrateUser(result.user, result.session.expires_at ? result.session.expires_at * 1000 : null);
    return { requiresEmailConfirmation: false };
  }, [hydrateUser]);

  const logout = useCallback(async (options?: { allSessions?: boolean }) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut(options?.allSessions ? { scope: "global" } : undefined);
    if (error) {
      setIsLoading(false);
      throw error;
    }
    setUser(null);
    setSessionExpiresAt(null);
    setActiveMode("user");
    writeStoredMode("user");
    setIsLoading(false);
  }, []);

  const logoutAllSessions = useCallback(async () => logout({ allSessions: true }), [logout]);

  const revokeDeviceSession = useCallback(async (_sessionId: string) => {
    throw new Error("Remote device session management is not available yet.");
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
    if (data.phone !== undefined) profileUpdate.phone_e164 = data.phone;

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
      if (data.phoneNumbers !== undefined) centerUpdate.phone_e164 = String(data.phoneNumbers).split(/[;,]/)[0]?.trim() || null;
      if (data.emergencyLine !== undefined) centerUpdate.emergency_phone_e164 = data.emergencyLine;
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
    await hydrateUser(data.session?.user ?? null, data.session?.expires_at ? data.session.expires_at * 1000 : null);
  }, [hydrateUser]);

  const currentSession = useMemo(() => null, []);

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? "user",
      activeMode,
      mode: activeMode,
      isAuthenticated: Boolean(user) && !isLoading,
      isLoading,
      sessionExpiresAt,
      rememberMe: true,
      deviceSessions: EMPTY_SESSIONS,
      currentSession,
      login,
      register,
      logout,
      logoutAllSessions,
      revokeDeviceSession,
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
