import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:42101",
];

function parseOrigin(value: string): string | null {
  const candidate = value.trim().replace(/\/+$/, "");
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) return null;
    const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !localHttp) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(): Set<string> {
  const configured = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map(parseOrigin)
    .filter((origin): origin is string => Boolean(origin));
  return new Set([...developmentOrigins, ...configured]);
}

export function corsHeadersFor(request: Request): Record<string, string> | null {
  const rawOrigin = request.headers.get("Origin");
  const origin = rawOrigin ? parseOrigin(rawOrigin) : null;
  if (!origin || !getAllowedOrigins().has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function jsonResponse(body: Record<string, unknown>, request: Request, status = 200, extraHeaders: Record<string, string> = {}): Response {
  const headers = corsHeadersFor(request);
  if (!headers) return new Response(null, { status: 403 });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, ...extraHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function handleOptions(request: Request): Response | null {
  const headers = corsHeadersFor(request);
  if (!headers) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, request, 405);
  return null;
}

export async function parseJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export function getRequiredSecret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
}

export function hasRequiredSecrets(names: string[]): boolean {
  return names.every((name) => Boolean(Deno.env.get(name)?.trim()));
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashValue(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

export function createAdminClient() {
  return createClient(
    getRequiredSecret("SUPABASE_URL"),
    getRequiredSecret("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function generateSixDigitOtp(): string {
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / 1_000_000) * 1_000_000;
  const bytes = new Uint8Array(4);
  let value: number;
  do {
    crypto.getRandomValues(bytes);
    value = new DataView(bytes.buffer).getUint32(0, false);
  } while (value >= limit);
  return String(value % 1_000_000).padStart(6, "0");
}

export function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function isE164(phone: unknown): phone is string {
  return typeof phone === "string" && /^\+[1-9]\d{7,14}$/.test(phone);
}

export function isSixDigitOtp(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}
