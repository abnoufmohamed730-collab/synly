import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const allowedProjectUrl = "https://ubbimzsxzfzruwqjugii.supabase.co";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-synly-seed-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const userEmail = "synly-test-user@example.test";
const vendorEmail = "synly-test-vendor@example.test";
const centerPosition = { latitude: 31.201, longitude: 29.919 };
const requestDescription = "Synly Phase 2 seed request — send an offer to test customer acceptance.";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function equalSecret(value: string, expected: string) {
  if (value.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < value.length; index += 1) {
    difference |= value.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function newPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `Synly!${hex}9`;
}

async function ensureAuthUser(admin: ReturnType<typeof createClient>, email: string, password: string, metadata: Record<string, unknown>) {
  const { data: page, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error(listError.message);
  const existing = page.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw new Error(error.message);
    return data.user;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

async function seedProfile(admin: ReturnType<typeof createClient>, userId: string, role: "user" | "vendor", displayName: string) {
  const { error } = await admin.from("profiles").upsert({
    user_id: userId,
    role,
    display_name: displayName,
    locale: "en",
    phone_e164: null,
  }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

async function seedUserRecords(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: vehicles, error: vehicleReadError } = await admin.from("vehicles").select("id").eq("owner_id", userId).order("created_at").limit(1);
  if (vehicleReadError) throw new Error(vehicleReadError.message);
  const vehicleValues = {
    owner_id: userId,
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    plate_number: "SYNLY-USER-01",
    transmission: "Automatic",
    fuel_type: "Gasoline",
  };
  let vehicleId = vehicles[0]?.id;
  const vehicleResult = vehicleId
    ? await admin.from("vehicles").update(vehicleValues).eq("id", vehicleId).select("id").single()
    : await admin.from("vehicles").insert(vehicleValues).select("id").single();
  if (vehicleResult.error) throw new Error(vehicleResult.error.message);
  vehicleId = vehicleResult.data.id;

  const { data: contacts, error: contactReadError } = await admin.from("emergency_contacts").select("id").eq("owner_id", userId).order("created_at").limit(1);
  if (contactReadError) throw new Error(contactReadError.message);
  const contactValues = { owner_id: userId, name: "Synly Test Emergency Contact", phone_e164: "+201055500001", relationship: "Family" };
  const contactResult = contacts[0]
    ? await admin.from("emergency_contacts").update(contactValues).eq("id", contacts[0].id)
    : await admin.from("emergency_contacts").insert(contactValues);
  if (contactResult.error) throw new Error(contactResult.error.message);
  return vehicleId;
}

async function seedVendorCenter(admin: ReturnType<typeof createClient>, userId: string) {
  const values = {
    owner_id: userId,
    name: "Synly Test Roadside Center",
    description: "Development-only test center for Synly Phase 2 flows.",
    service_type: "Towing/Roadside Assistance",
    phone_e164: "+201055500002",
    emergency_phone_e164: "+201055500003",
    latitude: centerPosition.latitude,
    longitude: centerPosition.longitude,
    address: "Moharam Bek, Alexandria, Egypt (approximate neighborhood coordinates)",
    timezone: "Africa/Cairo",
    is_online: true,
    verification_status: "approved",
    verified_at: new Date().toISOString(),
  };
  const { data: existing, error: centerReadError } = await admin.from("service_centers").select("id").eq("owner_id", userId).maybeSingle();
  if (centerReadError) throw new Error(centerReadError.message);
  const centerResult = existing
    ? await admin.from("service_centers").update(values).eq("id", existing.id).select("id").single()
    : await admin.from("service_centers").insert(values).select("id").single();
  if (centerResult.error) throw new Error(centerResult.error.message);
  const centerId = centerResult.data.id;

  const { error: hoursError } = await admin.from("service_center_hours").upsert(
    Array.from({ length: 7 }, (_, weekday) => ({
      service_center_id: centerId,
      weekday,
      opens_at: null,
      closes_at: null,
      hours_text: "Open 24 hours",
      is_closed: false,
      is_active: true,
    })),
    { onConflict: "service_center_id,weekday" },
  );
  if (hoursError) throw new Error(hoursError.message);

  const methods = ["Cash", "InstaPay", "E-Wallet", "Vodafone Cash", "Visa/Mastercard"];
  const { error: deleteMethodsError } = await admin.from("service_center_payment_methods").delete().eq("service_center_id", centerId);
  if (deleteMethodsError) throw new Error(deleteMethodsError.message);
  const { error: paymentMethodsError } = await admin.from("service_center_payment_methods").insert(methods.map((method) => ({ service_center_id: centerId, method, is_active: true })));
  if (paymentMethodsError) throw new Error(paymentMethodsError.message);
  return centerId;
}

async function seedActiveRequest(admin: ReturnType<typeof createClient>, customerId: string, vehicleId: string) {
  const { data: oldRequests, error: oldRequestReadError } = await admin.from("service_requests").select("id").eq("customer_id", customerId).eq("description", requestDescription);
  if (oldRequestReadError) throw new Error(oldRequestReadError.message);
  if (oldRequests.length) {
    const { error: deleteError } = await admin.from("service_requests").delete().in("id", oldRequests.map((request) => request.id));
    if (deleteError) throw new Error(deleteError.message);
  }

  const { data: request, error: requestError } = await admin.from("service_requests").insert({
    customer_id: customerId,
    vehicle_id: vehicleId,
    request_type: "towing",
    urgency: "emergency",
    status: "pending",
    description: requestDescription,
    latitude: centerPosition.latitude,
    longitude: centerPosition.longitude,
    address: "Moharam Bek, Alexandria, Egypt (approximate neighborhood coordinates)",
  }).select("id").single();
  if (requestError) throw new Error(requestError.message);

  const { error: eventError } = await admin.from("request_status_events").insert({
    request_id: request.id,
    actor_id: customerId,
    from_status: null,
    to_status: "pending",
    metadata: { event: "request_created", seeded_for_testing: true },
  });
  if (eventError) throw new Error(eventError.message);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  if (Deno.env.get("SYNLY_TEST_SEED_ENABLED") !== "true" || Deno.env.get("SUPABASE_URL") !== allowedProjectUrl) {
    return jsonResponse({ error: "Test seeding is disabled for this project." }, 404);
  }
  const expectedToken = Deno.env.get("SYNLY_TEST_SEED_TOKEN") ?? "";
  const suppliedToken = request.headers.get("x-synly-seed-token") ?? "";
  if (expectedToken.length < 32 || !equalSecret(suppliedToken, expectedToken)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const admin = createClient(allowedProjectUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const authorization = request.headers.get("Authorization") ?? "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    const { data: callerData, error: callerError } = await admin.auth.getUser(accessToken);
    if (callerError || !callerData.user) return jsonResponse({ error: "Sign in to a development account before seeding." }, 401);

    const userPassword = newPassword();
    const vendorPassword = newPassword();
    const user = await ensureAuthUser(admin, userEmail, userPassword, {
      role: "user",
      display_name: "Synly Test Driver",
      locale: "en",
      vehicle: { model: "Corolla", year: "2022", plate_number: "SYNLY-USER-01", transmission: "Automatic", fuel_type: "Gasoline" },
      emergency_contact: { name: "Synly Test Emergency Contact", phone_e164: "+201055500001" },
    });
    const vendor = await ensureAuthUser(admin, vendorEmail, vendorPassword, {
      role: "vendor",
      display_name: "Synly Test Vendor",
      locale: "en",
      service_center: {
        name: "Synly Test Roadside Center",
        service_type: "Towing/Roadside Assistance",
        phone_e164: "+201055500002",
        emergency_phone_e164: "+201055500003",
        latitude: String(centerPosition.latitude),
        longitude: String(centerPosition.longitude),
        address: "Moharam Bek, Alexandria, Egypt (approximate neighborhood coordinates)",
        hours_text: "Open 24 hours",
        payment_methods: ["Cash", "InstaPay", "E-Wallet", "Vodafone Cash", "Visa/Mastercard"],
      },
    });

    await seedProfile(admin, user.id, "user", "Synly Test Driver");
    await seedProfile(admin, vendor.id, "vendor", "Synly Test Vendor");
    const vehicleId = await seedUserRecords(admin, user.id);
    const centerId = await seedVendorCenter(admin, vendor.id);
    await seedActiveRequest(admin, user.id, vehicleId);

    return jsonResponse({
      message: "Development test accounts and request fixture are ready. Passwords are newly generated for this run.",
      customer: { email: userEmail, password: userPassword },
      vendor: { email: vendorEmail, password: vendorPassword },
      center: { id: centerId, latitude: centerPosition.latitude, longitude: centerPosition.longitude, address: "Moharam Bek, Alexandria (approximate)" },
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Could not seed test data." }, 500);
  }
});
