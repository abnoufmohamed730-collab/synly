# Phase 3 recovery, catalog, orders, and notifications

## Password recovery functions

`send-otp`, `verify-otp`, and `reset-password` use the live `profiles.user_id` / `profiles.phone_e164` schema. OTPs and reset tokens are stored only as hashes; OTP verification is atomic and capped at five attempts. OTP sends use an atomic per-phone 60-second cooldown and a five-per-hour limit. CORS allows only origins listed in `APP_ALLOWED_ORIGINS`; the local default is `http://localhost:42101`. Set the exact production and preview origins as a comma-separated Supabase Edge Function secret.

Required Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OTP_HASH_SECRET` — unique high-entropy value
- WhatsApp: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`
- Twilio: `SMS_PROVIDER_SID`, `SMS_PROVIDER_TOKEN`, `SMS_FROM_NUMBER`

The send endpoint deliberately responds generically whether or not the phone matches an account. Provider delivery failures and other sensitive values are not logged. The configured WhatsApp template must accept the OTP as its first body parameter.

## Catalog and orders

Catalog, order, and notification tables, their RLS policies, and database RPC/triggers have been applied to the connected Supabase project using the database integration. Catalog writes are limited to the center owner. `create_catalog_order` locks and validates active catalog rows, checks part stock, computes totals in SQL, writes immutable order line snapshots, and decrements inventory in one transaction. Checkout creates an offline-payment pending order.

## Notifications

Database audit/offer/order triggers create recipient-scoped notification rows. Authenticated clients can read their own notifications and update only `read_at`; the header bell listens for inserts over Supabase Realtime. Password-reset completion creates a security notification.

## Existing generated migration note

Do not edit generated SQL migration files here. The live OTP tables and functions were aligned with `profiles.phone_e164` using the connected database operation. Keep future schema changes in the managed database workflow, not handwritten migration files.
