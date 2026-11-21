import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const allowedProjectUrl = "https://ubbimzsxzfzruwqjugii.supabase.co";
const userEmail = "test.driver@synly.dev";
const vendorEmail = "test.vendor@synly.dev";
const location = { latitude: 30.0444, longitude: 31.2357 };
const paymentMethods = ["Cash", "InstaPay", "E-Wallet", "Vodafone Cash", "Visa/Mastercard"];

export interface LiveFixture {
  admin: SupabaseClient;
  createdUserIds: string[];
  createdVehicleIds: string[];
  createdContactIds: string[];
  centerCreated: boolean;
  customer: User;
  vendor: User;
  customerPassword: string;
  vendorPassword: string;
  centerId: string;
  requestDescription: string;
  originalProfileName: string | null;
  originalVehicle: Record<string, unknown> | null;
  originalContact: Record<string, unknown> | null;
  originalCenter: Record<string, unknown> | null;
  originalHours: Record<string, unknown>[];
  originalPayments: Record<string, unknown>[];
}

function testPassword() {
  return `Synly!${randomBytes(24).toString("hex")}9`;
}

export async function createLiveFixture(): Promise<LiveFixture> {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Live E2E requires Dyad-injected SUPABASE_URL and SUPABASE_SECRET_KEY.");
  if (url.replace(/\/$/, "") !== allowedProjectUrl) throw new Error("Live E2E is restricted to the connected Synly development/test Supabase project.");
  return {
    admin: createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } }),
    createdUserIds: [],
    createdVehicleIds: [],
    createdContactIds: [],
    centerCreated: false,
    customer: undefined as unknown as User,
    vendor: undefined as unknown as User,
    customerPassword: "",
    vendorPassword: "",
    centerId: "",
    requestDescription: `Live Phase 2 E2E roadside request ${randomBytes(6).toString("hex")}`,
    originalProfileName: null,
    originalVehicle: null,
    originalContact: null,
    originalCenter: null,
    originalHours: [],
    originalPayments: [],
  };
}

async function getOrCreateUser(fixture: LiveFixture, email: string, role: "user" | "vendor", passwordEnv: string | undefined, metadata: Record<string, unknown>) {
  const { data, error } = await fixture.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Could not inspect the live test accounts: ${error.message}`);
  const existing = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (existing) {
    if (existing.user_metadata?.synly_e2e_fixture !== true) throw new Error(`Refusing to modify existing unmarked account ${email}.`);
    if (!passwordEnv) throw new Error(`Set the matching E2E password variable to reuse ${email}.`);
    return { user: existing, password: passwordEnv };
  }
  const password = testPassword();
  const { data: created, error: createError } = await fixture.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { ...metadata, role, synly_e2e_fixture: true },
  });
  if (createError) throw new Error(`Could not create ${email}: ${createError.message}`);
  if (!created.user?.id) throw new Error(`Supabase did not return an ID for ${email}.`);
  fixture.createdUserIds.push(created.user.id);
  return { user: created.user, password };
}

export async function provisionLiveFixture(fixture: LiveFixture) {
  const customerResult = await getOrCreateUser(fixture, userEmail, "user", process.env.SYNLY_LIVE_USER_PASSWORD, {
    display_name: "Synly Live Test Driver",
    locale: "en",
    vehicle: { make: "Toyota", model: "Corolla", year: "2022", plate_number: "SYNLY-LIVE-01", transmission: "Automatic", fuel_type: "Gasoline" },
    emergency_contact: { name: "Live E2E Emergency Contact", phone_e164: "+201055500011" },
  });
  fixture.customer = customerResult.user;
  fixture.customerPassword = customerResult.password;

  const vendorResult = await getOrCreateUser(fixture, vendorEmail, "vendor", process.env.SYNLY_LIVE_VENDOR_PASSWORD, {
    display_name: "Synly Live Test Vendor",
    locale: "en",
    service_center: {
      name: "Synly Live Test Center",
      service_type: "Towing/Roadside Assistance",
      phone_e164: "+201055500012",
      emergency_phone_e164: "+201055500013",
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      address: "Downtown Cairo, Egypt",
      hours_text: "Open 24 hours",
      payment_methods: paymentMethods,
    },
  });
  fixture.vendor = vendorResult.user;
  fixture.vendorPassword = vendorResult.password;

  const { data: profile, error: profileError } = await fixture.admin.from("profiles").select("role,display_name").eq("user_id", fixture.customer.id).single();
  if (profileError) throw new Error(`Customer profile setup failed: ${profileError.message}`);
  if (profile.role !== "user") throw new Error("The live customer account must have role 'user'.");
  fixture.originalProfileName = profile.display_name;

  const { data: vendorProfile, error: vendorProfileError } = await fixture.admin.from("profiles").select("role").eq("user_id", fixture.vendor.id).single();
  if (vendorProfileError) throw new Error(`Vendor profile setup failed: ${vendorProfileError.message}`);
  if (vendorProfile.role !== "vendor") throw new Error("The live service-center account must have role 'vendor'.");

  const [{ data: vehicles, error: vehicleError }, { data: contacts, error: contactError }] = await Promise.all([
    fixture.admin.from("vehicles").select("*").eq("owner_id", fixture.customer.id).order("created_at").limit(1),
    fixture.admin.from("emergency_contacts").select("*").eq("owner_id", fixture.customer.id).order("created_at").limit(1),
  ]);
  if (vehicleError) throw new Error(`Could not inspect the customer vehicle: ${vehicleError.message}`);
  if (contactError) throw new Error(`Could not inspect the emergency contact: ${contactError.message}`);
  const vehicleValues = { owner_id: fixture.customer.id, make: "Toyota", model: "Corolla", year: 2022, plate_number: "SYNLY-LIVE-01", transmission: "Automatic", fuel_type: "Gasoline" };
  const contactValues = { owner_id: fixture.customer.id, name: "Live E2E Emergency Contact", phone_e164: "+201055500011", relationship: "Family" };
  fixture.originalVehicle = vehicles[0] ?? null;
  fixture.originalContact = contacts[0] ?? null;
  if (vehicles[0]) {
    const { error } = await fixture.admin.from("vehicles").update(vehicleValues).eq("id", vehicles[0].id);
    if (error) throw new Error(`Could not prepare the customer vehicle: ${error.message}`);
  } else {
    const { data, error } = await fixture.admin.from("vehicles").insert(vehicleValues).select("id").single();
    if (error) throw new Error(`Could not seed the customer vehicle: ${error.message}`);
    fixture.createdVehicleIds.push(data.id);
  }
  if (contacts[0]) {
    const { error } = await fixture.admin.from("emergency_contacts").update(contactValues).eq("id", contacts[0].id);
    if (error) throw new Error(`Could not prepare the emergency contact: ${error.message}`);
  } else {
    const { data, error } = await fixture.admin.from("emergency_contacts").insert(contactValues).select("id").single();
    if (error) throw new Error(`Could not seed the emergency contact: ${error.message}`);
    fixture.createdContactIds.push(data.id);
  }

  const { data: existingCenter, error: centerError } = await fixture.admin.from("service_centers").select("*").eq("owner_id", fixture.vendor.id).maybeSingle();
  if (centerError) throw new Error(`Could not inspect the vendor center: ${centerError.message}`);
  if (existingCenter) fixture.originalCenter = existingCenter;
  const centerValues = {
    name: "Synly Live Test Center",
    description: "Development-only center for Phase 1 and Phase 2 live E2E testing.",
    service_type: "Towing/Roadside Assistance",
    phone_e164: "+201055500012",
    emergency_phone_e164: "+201055500013",
    latitude: location.latitude,
    longitude: location.longitude,
    address: "Downtown Cairo, Egypt",
    timezone: "Africa/Cairo",
    is_online: true,
    verification_status: "approved",
    verified_at: new Date().toISOString(),
  };
  if (existingCenter) {
    fixture.centerId = existingCenter.id;
  } else {
    const { data, error } = await fixture.admin.from("service_centers").insert({ owner_id: fixture.vendor.id, ...centerValues }).select("id").single();
    if (error) throw new Error(`Could not seed the test service center: ${error.message}`);
    fixture.centerId = data.id;
    fixture.centerCreated = true;
  }

  const [{ data: hours, error: hoursError }, { data: payments, error: paymentsError }] = await Promise.all([
    fixture.admin.from("service_center_hours").select("*").eq("service_center_id", fixture.centerId),
    fixture.admin.from("service_center_payment_methods").select("*").eq("service_center_id", fixture.centerId),
  ]);
  if (hoursError) throw new Error(`Could not inspect center hours: ${hoursError.message}`);
  if (paymentsError) throw new Error(`Could not inspect center payment methods: ${paymentsError.message}`);
  fixture.originalHours = hours;
  fixture.originalPayments = payments;

  const { error: updateCenterError } = await fixture.admin.from("service_centers").update(centerValues).eq("id", fixture.centerId);
  if (updateCenterError) throw new Error(`Could not prepare approved test center: ${updateCenterError.message}`);
  const { error: hoursSeedError } = await fixture.admin.from("service_center_hours").upsert(
    Array.from({ length: 7 }, (_, weekday) => ({ service_center_id: fixture.centerId, weekday, opens_at: null, closes_at: null, hours_text: "Open 24 hours", is_closed: false, is_active: true })),
    { onConflict: "service_center_id,weekday" },
  );
  if (hoursSeedError) throw new Error(`Could not seed center working hours: ${hoursSeedError.message}`);
  const { error: clearPaymentsError } = await fixture.admin.from("service_center_payment_methods").delete().eq("service_center_id", fixture.centerId);
  if (clearPaymentsError) throw new Error(`Could not prepare center payment methods: ${clearPaymentsError.message}`);
  const { error: paymentSeedError } = await fixture.admin.from("service_center_payment_methods").insert(paymentMethods.map((method) => ({ service_center_id: fixture.centerId, method, is_active: true })));
  if (paymentSeedError) throw new Error(`Could not seed center payment methods: ${paymentSeedError.message}`);
}

export async function cleanupLiveFixture(fixture: LiveFixture) {
  const errors: string[] = [];
  if (fixture.customer?.id && fixture.requestDescription) {
    const { data: requests, error: requestReadError } = await fixture.admin.from("service_requests").select("id").eq("customer_id", fixture.customer.id).eq("description", fixture.requestDescription);
    if (requestReadError) errors.push(requestReadError.message);
    else if (requests.length) {
      const { error } = await fixture.admin.from("service_requests").delete().in("id", requests.map((request) => request.id));
      if (error) errors.push(error.message);
    }
  }

  for (const vehicleId of fixture.createdVehicleIds) {
    const { error } = await fixture.admin.from("vehicles").delete().eq("id", vehicleId);
    if (error) errors.push(error.message);
  }
  for (const contactId of fixture.createdContactIds) {
    const { error } = await fixture.admin.from("emergency_contacts").delete().eq("id", contactId);
    if (error) errors.push(error.message);
  }
  if (fixture.customer?.id && !fixture.createdUserIds.includes(fixture.customer.id)) {
    if (fixture.originalProfileName !== null) {
      const { error } = await fixture.admin.from("profiles").update({ display_name: fixture.originalProfileName }).eq("user_id", fixture.customer.id);
      if (error) errors.push(error.message);
    }
    if (fixture.originalVehicle) {
      const { error } = await fixture.admin.from("vehicles").update({ make: fixture.originalVehicle.make, model: fixture.originalVehicle.model, year: fixture.originalVehicle.year, plate_number: fixture.originalVehicle.plate_number, transmission: fixture.originalVehicle.transmission, fuel_type: fixture.originalVehicle.fuel_type }).eq("id", fixture.originalVehicle.id);
      if (error) errors.push(error.message);
    }
    if (fixture.originalContact) {
      const { error } = await fixture.admin.from("emergency_contacts").update({ name: fixture.originalContact.name, phone_e164: fixture.originalContact.phone_e164, relationship: fixture.originalContact.relationship }).eq("id", fixture.originalContact.id);
      if (error) errors.push(error.message);
    }
  }

  if (fixture.centerId && !fixture.centerCreated && fixture.originalCenter && fixture.vendor && !fixture.createdUserIds.includes(fixture.vendor.id)) {
    const originalCenterFields = Object.fromEntries(["name", "description", "service_type", "phone_e164", "emergency_phone_e164", "latitude", "longitude", "address", "timezone", "is_online", "verification_status", "verified_at"].map((key) => [key, fixture.originalCenter?.[key]]));
    const { error: centerError } = await fixture.admin.from("service_centers").update(originalCenterFields).eq("id", fixture.centerId);
    if (centerError) errors.push(centerError.message);
    const { error: hoursDeleteError } = await fixture.admin.from("service_center_hours").delete().eq("service_center_id", fixture.centerId);
    if (hoursDeleteError) errors.push(hoursDeleteError.message);
    if (fixture.originalHours.length) {
      const { error } = await fixture.admin.from("service_center_hours").insert(fixture.originalHours);
      if (error) errors.push(error.message);
    }
    const { error: paymentsDeleteError } = await fixture.admin.from("service_center_payment_methods").delete().eq("service_center_id", fixture.centerId);
    if (paymentsDeleteError) errors.push(paymentsDeleteError.message);
    if (fixture.originalPayments.length) {
      const { error } = await fixture.admin.from("service_center_payment_methods").insert(fixture.originalPayments);
      if (error) errors.push(error.message);
    }
  }
  if (fixture.centerCreated && fixture.centerId) {
    const { error } = await fixture.admin.from("service_centers").delete().eq("id", fixture.centerId);
    if (error) errors.push(error.message);
  }

  for (const userId of [...fixture.createdUserIds].reverse()) {
    const { error } = await fixture.admin.auth.admin.deleteUser(userId);
    if (error) errors.push(error.message);
  }
  if (errors.length) throw new Error(`Live fixture cleanup failed: ${errors.join("; ")}`);
}

export async function getCustomerRlsClient(accessToken: string, refreshToken: string) {
  const url = process.env.SUPABASE_URL!;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_FfGtqg9f31fRBIOAIsTljQ_BqBfIZLD";
  const client = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw new Error(`Could not verify the user session for RLS checks: ${error.message}`);
  return client;
}
