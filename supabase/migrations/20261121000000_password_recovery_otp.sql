create table if not exists public.password_reset_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null check (phone ~ '^[+][1-9][0-9]{7,14}$'),
  otp_hash text not null check (otp_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_otps_phone_latest_idx
  on public.password_reset_otps (phone, created_at desc)
  where used_at is null;

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  phone text not null check (phone ~ '^[+][1-9][0-9]{7,14}$'),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_phone_latest_idx
  on public.password_reset_tokens (phone, created_at desc)
  where used_at is null;

alter table public.password_reset_otps enable row level security;
alter table public.password_reset_tokens enable row level security;

revoke all on public.password_reset_otps from anon, authenticated;
revoke all on public.password_reset_tokens from anon, authenticated;
grant all on public.password_reset_otps to service_role;
grant all on public.password_reset_tokens to service_role;

comment on table public.password_reset_otps is 'Short-lived OTP hashes. Accessible only to service-role Edge Functions.';
comment on table public.password_reset_tokens is 'Single-use password reset token hashes. Accessible only to service-role Edge Functions.';
