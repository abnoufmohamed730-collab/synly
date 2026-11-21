import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "http://localhost:42101")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export function corsHeadersFor(request: Request): Record<string, string> | null {
  const origin = request.headers.get("Origin")?.replace(/\/$/, "");
  if (!origin || !allowedOrigins.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function jsonResponse(body: Record<string, unknown>, request: Request, status = 200): Response {
  const headers = corsHeadersFor(request);
  if (!headers) return new Response(null, { status: 403 });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
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
