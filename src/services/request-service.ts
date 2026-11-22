import { supabase } from "../integrations/supabase/client";

export type RequestStatus = "pending" | "offered" | "accepted" | "in_progress" | "completed" | "cancelled";
export type RequestUrgency = "normal" | "urgent" | "emergency" | "scheduled";
export type RequestType = "towing" | "battery" | "tire" | "fuel" | "lockout" | "mechanical" | "maintenance" | "spare_parts" | "other";

export interface ServiceRequest {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  request_type: RequestType;
  urgency: RequestUrgency;
  status: RequestStatus;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  scheduled_at: string | null;
  assigned_center_id: string | null;
  accepted_offer_id: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  offers?: RequestOffer[];
}

export interface RequestOffer {
  id: string;
  request_id: string;
  service_center_id: string;
  price: number;
  currency: string;
  message: string | null;
  estimated_arrival_minutes: number | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  service_centers?: { name: string; service_type: string; phone_e164: string | null } | null;
}

export interface NearbyCenter {
  id: string;
  name: string;
  service_type: string;
  phone_e164: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  distance_km: number;
  is_online: boolean;
  open_now: boolean;
}

export interface NewServiceRequest {
  requestType: RequestType;
  urgency: RequestUrgency;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  vehicleId?: string | null;
  scheduledAt?: string | null;
  assignedCenterId?: string | null;
}

async function unwrap<T>(result: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await result;
  if (error) throw new Error(error.message);
  return data as T;
}

export async function searchNearbyCenters(params: { latitude: number; longitude: number; radiusKm?: number; serviceType?: string; openNow?: boolean | null; query?: string; }) {
  return unwrap<NearbyCenter[]>(supabase.rpc("search_nearby_centers", {
    p_latitude: params.latitude, p_longitude: params.longitude, p_radius_km: params.radiusKm ?? 20,
    p_service_type: params.serviceType || null, p_open_now: params.openNow ?? null, p_query: params.query?.trim() || null,
  }));
}

export async function createServiceRequest(request: NewServiceRequest) {
  return unwrap<string>(supabase.rpc("create_service_request", {
    p_request_type: request.requestType, p_urgency: request.urgency, p_description: request.description,
    p_latitude: request.latitude, p_longitude: request.longitude, p_address: request.address || null,
    p_vehicle_id: request.vehicleId || null, p_scheduled_at: request.scheduledAt || null,
    p_assigned_center_id: request.assignedCenterId || null,
  }));
}

export async function getCustomerVehicles(userId: string) {
  return unwrap<Array<{ id: string; make: string | null; model: string; year: number | null; plate_number: string }>>(
    supabase.from("vehicles").select("id,make,model,year,plate_number").eq("owner_id", userId).order("created_at"),
  );
}

export async function getCustomerRequests(customerId: string) {
  const requests = await unwrap<ServiceRequest[]>(supabase.from("service_requests").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }));
  if (!requests.length) return requests;
  const offers = await unwrap<RequestOffer[]>(supabase.from("request_offers").select("*,service_centers(name,service_type,phone_e164)").in("request_id", requests.map((request) => request.id)).order("created_at"));
  return requests.map((request) => ({ ...request, offers: offers.filter((offer) => offer.request_id === request.id) }));
}

export async function getVendorRequests() {
  return unwrap<ServiceRequest[]>(supabase.from("service_requests").select("*").in("status", ["pending", "offered", "accepted", "in_progress", "completed", "cancelled"]).order("created_at", { ascending: false }));
}

export async function getVendorOffers(centerId: string) {
  return unwrap<RequestOffer[]>(supabase.from("request_offers").select("*").eq("service_center_id", centerId).order("created_at", { ascending: false }));
}

export async function getOwnCenter(userId: string) {
  const rows = await unwrap<Array<{ id: string; is_online: boolean; verification_status: string }>>(supabase.from("service_centers").select("id,is_online,verification_status").eq("owner_id", userId).limit(1));
  return rows[0] ?? null;
}

export async function setCenterOnline(ownerId: string, isOnline: boolean) {
  await unwrap(supabase.from("service_centers").update({ is_online: isOnline }).eq("owner_id", ownerId));
}

export async function submitRequestOffer(requestId: string, price: number, message: string, estimatedArrivalMinutes: number | null) {
  return unwrap<string>(supabase.rpc("submit_request_offer", { p_request_id: requestId, p_price: price, p_message: message || null, p_estimated_arrival_minutes: estimatedArrivalMinutes, p_currency: "EGP" }));
}

export async function acceptRequestOffer(offerId: string) { return unwrap<string>(supabase.rpc("accept_request_offer", { p_offer_id: offerId })); }
export async function declineServiceRequest(requestId: string) { await unwrap(supabase.rpc("decline_service_request", { p_request_id: requestId })); }
export async function cancelServiceRequest(requestId: string) { return unwrap<string>(supabase.rpc("cancel_service_request", { p_request_id: requestId })); }
export async function transitionServiceRequest(requestId: string, status: "in_progress" | "completed") { return unwrap<string>(supabase.rpc("transition_service_request", { p_request_id: requestId, p_to_status: status })); }

type SubscriptionCleanup = () => void;

const activeSubscriptions = new Map<string, SubscriptionCleanup>();

function subscribeDebounced(channelName: string, configure: (channel: ReturnType<typeof supabase.channel>, onChange: () => void) => void, onChange: () => void): SubscriptionCleanup {
  let timer: number | undefined;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(onChange, 300);
  };
  const channel = supabase.channel(`${channelName}:${crypto.randomUUID()}`);
  configure(channel, schedule);
  channel.subscribe();
  return () => {
    window.clearTimeout(timer);
    void (async () => { await supabase.removeChannel(channel); })();
  };
}

export function subscribeToCustomerRequestChanges(userId: string, onChange: () => void): SubscriptionCleanup {
  const key = `customer:${userId}`;
  // Clean up any existing subscription for this user before creating a new one
  const existing = activeSubscriptions.get(key);
  if (existing) existing();
  const cleanup = subscribeDebounced(`customer-requests:${userId}`, (channel, changed) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `customer_id=eq.${userId}` }, changed)
      .on("postgres_changes", { event: "*", schema: "public", table: "request_offers" }, changed);
  }, onChange);
  activeSubscriptions.set(key, cleanup);
  return () => {
    cleanup();
    activeSubscriptions.delete(key);
  };
}

export function subscribeToCenterRequestChanges(centerId: string, onChange: () => void): SubscriptionCleanup {
  const key = `center:${centerId}`;
  // Clean up any existing subscription for this center before creating a new one
  const existing = activeSubscriptions.get(key);
  if (existing) existing();
  const cleanup = subscribeDebounced(`service-center-requests:${centerId}`, (channel, changed) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, changed)
      .on("postgres_changes", { event: "*", schema: "public", table: "request_offers", filter: `service_center_id=eq.${centerId}` }, changed);
  }, onChange);
  activeSubscriptions.set(key, cleanup);
  return () => {
    cleanup();
    activeSubscriptions.delete(key);
  };
}