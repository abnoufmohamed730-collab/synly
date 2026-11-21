# Password recovery Edge Functions

These are source scaffolds only. No Supabase project is connected or deployed. The existing Synly browser recovery UI still uses its mock recovery service and is not wired to these functions.

## Required database shape

The migration creates the service-role-only `password_reset_otps` and `password_reset_tokens` tables. The existing `public.profiles` table must have a `phone` column containing E.164 phone numbers and a `user_id` column containing the associated Supabase Auth user UUID.

## Function secrets

Set these secrets in the eventual Supabase project without committing their values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OTP_HASH_SECRET` — use a unique, high-entropy random secret
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE` for WhatsApp delivery
- `SMS_PROVIDER_SID`, `SMS_PROVIDER_TOKEN`, `SMS_FROM_NUMBER` for Twilio SMS delivery

Create an approved WhatsApp Cloud API template whose first body variable is the OTP parameter. SMS uses the Twilio Messages REST API.

The public send endpoint intentionally returns the same accepted response whether or not a matching profile exists. Configure production CORS to the Synly app origin and add per-phone/IP request throttling before deployment.
