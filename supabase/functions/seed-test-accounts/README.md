# Synly development test accounts

This seeder is intentionally restricted to the connected Synly development project (`ubbimzsxzfzruwqjugii`). It returns 404 unless both the exact project URL and `SYNLY_TEST_SEED_ENABLED=true` are present. It also requires a high-entropy `SYNLY_TEST_SEED_TOKEN` of at least 32 characters. The browser page that invokes it is only routed into Vite development builds at `/__dev/seed-test-accounts`.

## One-time development setup

In the development Supabase project, open **Project → Edge Functions → Manage Secrets** and add:

- `SYNLY_TEST_SEED_ENABLED` = `true`
- `SYNLY_TEST_SEED_TOKEN` = a private random value of at least 32 characters

Never set the enable flag or token in a production project. The function uses the project's server-side `SUPABASE_SERVICE_ROLE_KEY`; it never exposes that key to the browser. Service-role operations create the approved center and fixtures without changing RLS, grants, the normal registration flow, or approval policies.

Sign in to the development app with an existing development account (or create one through the normal registration flow), then open the preview at `/__dev/seed-test-accounts`, paste the token, and choose **Create / reset test accounts**. The Edge Function verifies that signed-in Supabase JWT as well as the project seed token. Each run rotates both passwords, replaces the prior seeded request, and displays the credentials once in the page. Save the returned passwords before leaving it.

The vendor center and sample request use approximate Moharam Bek coordinates (`31.201, 29.919`), not device GPS coordinates. The customer account has a pending emergency towing request so it can receive an offer from the seeded center.

## Seeded identities

- `synly-test-user@example.test` — regular user with a 2022 Toyota Corolla, emergency contact, and pending test request.
- `synly-test-vendor@example.test` — vendor with an approved, online towing center, 24-hour hours, and the app's supported payment methods.

The passwords are generated per seed run and returned only by the protected development page; they are not stored in source control.

If the development enable flag or token is removed, the function immediately stops provisioning. To remove the fixtures completely, delete the two test Auth users from the development project's Auth user management; their linked data is configured to cascade with user deletion.
