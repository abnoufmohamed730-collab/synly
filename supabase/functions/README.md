# Phase 3 recovery, catalog, orders, and notifications

## Password recovery Edge Function secrets

Add these exact names in **Supabase → Edge Functions → Secrets**. Never add the service-role key to browser variables or commit secret values.

- `SUPABASE_URL` — project URL, e.g. `https://<project-ref>.supabase.co`.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role/secret key; server-side only.
- `OTP_HASH_SECRET` — a unique, high-entropy random string used to hash OTPs and reset tokens.
- `APP_ALLOWED_ORIGINS` — optional comma-separated list of exact origins. Example: `https://synly.example.com,https://preview.synly.example.com`. Each entry must be an origin with no path, query, or credentials. Whitespace and trailing slash(es) are normalized. Non-local origins must use HTTPS.
- WhatsApp Cloud API: `WHATSAPP_ACCESS_TOKEN` (opaque bearer token), `WHATSAPP_PHONE_NUMBER_ID` (Meta phone-number ID), `WHATSAPP_OTP_TEMPLATE` (approved template name; its first body parameter receives the code).
- Twilio SMS: `SMS_PROVIDER_SID` (Account SID, usually `AC…`), `SMS_PROVIDER_TOKEN` (Auth Token), `SMS_FROM_NUMBER` (Twilio-enabled E.164 sender number such as `+15551234567`).

The three local origins `http://localhost:5173`, `http://127.0.0.1:5173`, and `http://localhost:42101` are always allowlisted. Configured HTTPS production/preview origins are added to them; the allowlist is exact and never uses `*`. Invalid configured entries are ignored. Browser requests from an origin with a path are rejected.

`send-otp` checks `OTP_HASH_SECRET` and the selected channel's provider secrets before looking up the phone number. If required configuration is missing, it returns a channel-specific `503` without creating or returning an OTP; there is no demo-code or OTP-in-response fallback. Once configured, delivery is sent through the selected provider. Unknown phone numbers receive the same generic accepted response as known numbers. Provider failures are logged with a static message only and receive that same generic response to avoid account enumeration. Logs and responses never contain codes, reset tokens, or secret values.

OTP records and reset tokens are hashed; OTP verification is atomic and capped at five attempts. OTP sends have an atomic per-phone 60-second cooldown and a five-per-hour limit. Configure an approved WhatsApp template before selecting that channel. To test without sending, use a test phone/provider configuration; the function intentionally does not reveal the OTP to the browser or logs.

## Catalog and orders

Catalog, order, and notification tables, their RLS policies, and database RPC/triggers have been applied to the connected Supabase project using the database integration. Catalog writes are limited to the center owner. `create_catalog_order` locks and validates active catalog rows, checks part stock, computes totals in SQL, writes immutable order line snapshots, and decrements inventory in one transaction. Checkout creates an offline-payment pending order.

## Notifications

Database audit/offer/order triggers create recipient-scoped notification rows. Authenticated clients can read their own notifications and update only `read_at`; the header bell listens for inserts over Supabase Realtime. Password-reset completion creates a security notification.

## Existing generated migration note

Do not edit generated SQL migration files here. The live OTP tables and functions were aligned with `profiles.phone_e164` using the connected database operation. Keep future schema changes in the managed database workflow, not handwritten migration files.
