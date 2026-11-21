import { supabase } from "../integrations/supabase/client";
import type { RegisterData, Role, User } from "../context/auth-types";

export interface ProfileSnapshot {
  profile: Record<string, any>;
  preferences: Record<string, any> | null;
  vehicles: Record<string, any>[];
  emergencyContacts: Record<string, any>[];
  serviceCenter: Record<string, any> | null;
  hours: Record<string, any>[];
  paymentMethods: Record<string, any>[];
  socialLinks: Record<string, any>[];
}

async function getRows<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export async function fetchProfileSnapshot(userId: string): Promise<ProfileSnapshot> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (profileError) throw new Error(profileError.message);

  const [preferencesResult, vehicles, emergencyContacts, centers] = await Promise.all([
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
    getRows<Record<string, any>[]>(supabase.from("vehicles").select("*").eq("owner_id", userId).order("created_at")),
    getRows<Record<string, any>[]>(supabase.from("emergency_contacts").select("*").eq("owner_id", userId).order("created_at")),
    getRows<Record<string, any>[]>(supabase.from("service_centers").select("*").eq("owner_id", userId).limit(1)),
  ]);

  if (preferencesResult.error) throw new Error(preferencesResult.error.message);
  const preferences = preferencesResult.data;
  const serviceCenter = centers[0] ?? null;
  const [hours, paymentMethods, socialLinks] = serviceCenter
    ? await Promise.all([
        getRows<Record<string, any>[]>(supabase.from("service_center_hours").select("*").eq("service_center_id", serviceCenter.id).order("weekday")),
        getRows<Record<string, any>[]>(supabase.from("service_center_payment_methods").select("*").eq("service_center_id", serviceCenter.id)),
        getRows<Record<string, any>[]>(supabase.from("service_center_social_links").select("*").eq("service_center_id", serviceCenter.id)),
      ])
    : [[], [], []];

  return { profile, preferences, vehicles, emergencyContacts, serviceCenter, hours, paymentMethods, socialLinks };
}

export function mapSnapshotToUser(snapshot: ProfileSnapshot, authUser: { id: string; email?: string }): User {
  const profile = snapshot.profile;
  const center = snapshot.serviceCenter;
  const vehicle = snapshot.vehicles[0];
  const contact = snapshot.emergencyContacts[0];
  const role: Role = profile.role === "vendor" ? "vendor" : "user";
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    businessName: role === "vendor" ? center?.name ?? profile.display_name : profile.display_name,
    serviceType: center?.service_type ?? "",
    description: center?.description ?? "",
    location: center?.address ?? (center ? `${center.latitude}, ${center.longitude}` : ""),
    operatingHours: snapshot.hours[0]?.hours_text ?? "",
    status: center?.is_online ? "online" : "offline",
    verified: center?.verification_status === "approved",
    role,
    username: profile.display_name,
    phone: profile.phone_e164 ?? "",
    carModel: vehicle?.model,
    plateNumber: vehicle?.plate_number,
    yearOfManufacture: vehicle?.year ? String(vehicle.year) : undefined,
    transmission: vehicle?.transmission ?? undefined,
    fuelType: vehicle?.fuel_type ?? undefined,
    emergencyContactName: contact?.name,
    emergencyContactPhone: contact?.phone_e164,
    phoneNumbers: center?.phone_e164 ?? "",
    emergencyLine: center?.emergency_phone_e164 ?? "",
    paymentMethods: snapshot.paymentMethods.map((item) => item.method),
    socialFacebook: snapshot.socialLinks.find((item) => item.platform === "facebook")?.url ?? "",
    socialWhatsApp: snapshot.socialLinks.find((item) => item.platform === "whatsapp")?.url ?? "",
    socialInstagram: snapshot.socialLinks.find((item) => item.platform === "instagram")?.url ?? "",
  };
}

export function buildSignupMetadata(data: RegisterData) {
  return {
    role: data.role,
    display_name: data.username.trim(),
    phone_e164: data.phone.trim(),
    locale: data.locale ?? "en",
    ...(data.role === "user"
      ? {
          vehicle: {
            model: data.carModel?.trim(),
            year: data.yearOfManufacture,
            plate_number: data.plateNumber?.trim(),
            transmission: data.transmission,
            fuel_type: data.fuelType,
          },
          emergency_contact: {
            name: data.emergencyContactName?.trim(),
            phone_e164: data.emergencyContactPhone?.trim(),
          },
        }
      : {
          service_center: {
            name: data.businessName?.trim(),
            service_type: data.serviceType,
            phone_e164: data.phoneNumbers?.toString().split(/[;,]/)[0]?.trim() || data.phone.trim(),
            emergency_phone_e164: data.emergencyLine?.trim(),
            latitude: data.coordinates?.lat,
            longitude: data.coordinates?.lng,
            address: "",
            hours_text: data.workingHours?.trim(),
            payment_methods: data.paymentMethods ?? [],
            social_links: {
              facebook: data.socialFacebook?.trim(),
              whatsapp: data.socialWhatsApp?.trim(),
              instagram: data.socialInstagram?.trim(),
            },
          },
        }),
  };
}

export async function saveVehicleAndContact(userId: string, values: {
  model: string;
  plateNumber: string;
  emergencyName: string;
  emergencyPhone: string;
}) {
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (vehicleError) throw new Error(vehicleError.message);

  const vehicleQuery = vehicle
    ? supabase.from("vehicles").update({ model: values.model, plate_number: values.plateNumber }).eq("id", vehicle.id)
    : supabase.from("vehicles").insert({ owner_id: userId, model: values.model, plate_number: values.plateNumber });
  const { error: saveVehicleError } = await vehicleQuery;
  if (saveVehicleError) throw new Error(saveVehicleError.message);

  const { data: contact, error: contactError } = await supabase
    .from("emergency_contacts")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (contactError) throw new Error(contactError.message);

  const contactQuery = contact
    ? supabase.from("emergency_contacts").update({ name: values.emergencyName, phone_e164: values.emergencyPhone }).eq("id", contact.id)
    : supabase.from("emergency_contacts").insert({ owner_id: userId, name: values.emergencyName, phone_e164: values.emergencyPhone });
  const { error: saveContactError } = await contactQuery;
  if (saveContactError) throw new Error(saveContactError.message);
}

export async function savePreferences(userId: string, values: { alertRadius: number; notificationsEnabled: boolean }) {
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: userId,
    alert_radius_km: values.alertRadius,
    notifications_enabled: values.notificationsEnabled,
  });
  if (error) throw new Error(error.message);
}

export async function saveCenterHours(ownerId: string, hoursText: string) {
  const { data: center, error: centerError } = await supabase
    .from("service_centers")
    .select("id")
    .eq("owner_id", ownerId)
    .single();
  if (centerError) throw new Error(centerError.message);
  const { error } = await supabase
    .from("service_center_hours")
    .update({ hours_text: hoursText })
    .eq("service_center_id", center.id);
  if (error) throw new Error(error.message);
}
