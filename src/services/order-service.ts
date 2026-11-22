import { supabase } from "../integrations/supabase/client";

export type OrderStatus = "pending" | "accepted" | "rejected" | "fulfilled" | "cancelled";

export interface OrderItem {
  id: string;
  catalog_item_id: string | null;
  name_snapshot: string;
  item_type: "service" | "part";
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  customer_id: string;
  service_center_id: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  service_centers?: { name: string; service_type: string; phone_e164: string | null } | null;
}

async function unwrap<T>(result: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await result;
  if (error) throw new Error(error.message);
  return data as T;
}

const orderSelect = "id,customer_id,service_center_id,status,subtotal,total,payment_method,created_at,updated_at,service_centers(name,service_type,phone_e164),order_items(id,catalog_item_id,name_snapshot,item_type,unit_price,quantity,line_total)";

function normalize(rows: Order[]): Order[] {
  return rows.map((row) => ({
    ...row,
    items: (row.items ?? []).slice().sort((left, right) => left.name_snapshot.localeCompare(right.name_snapshot)),
  }));
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const rows = await unwrap<Order[]>(
    supabase.from("orders").select(orderSelect).eq("customer_id", customerId).order("created_at", { ascending: false }),
  );
  return normalize(rows);
}

export async function getVendorOrders(centerId: string): Promise<Order[]> {
  const rows = await unwrap<Order[]>(
    supabase.from("orders").select(orderSelect).eq("service_center_id", centerId).order("created_at", { ascending: false }),
  );
  return normalize(rows);
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<string> {
  return unwrap<string>(supabase.rpc("set_catalog_order_status", { p_order_id: orderId, p_status: status }));
}

type SubscriptionCleanup = () => void;

const activeSubscriptions = new Map<string, SubscriptionCleanup>();

function subscribeDebounced(key: string, channelName: string, filter: { column: string; value: string }, onChange: () => void): SubscriptionCleanup {
  activeSubscriptions.get(key)?.();
  let timer: number | undefined;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(onChange, 300);
  };
  const channel = supabase.channel(`${channelName}:${crypto.randomUUID()}`);
  channel
    .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `${filter.column}=eq.${filter.value}` }, schedule)
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, schedule)
    .subscribe();
  const cleanup = () => {
    window.clearTimeout(timer);
    void (async () => { await supabase.removeChannel(channel); })();
  };
  activeSubscriptions.set(key, cleanup);
  return () => {
    cleanup();
    activeSubscriptions.delete(key);
  };
}

export function subscribeToCustomerOrders(customerId: string, onChange: () => void): SubscriptionCleanup {
  return subscribeDebounced(`customer-orders:${customerId}`, "customer-orders", { column: "customer_id", value: customerId }, onChange);
}

export function subscribeToVendorOrders(centerId: string, onChange: () => void): SubscriptionCleanup {
  return subscribeDebounced(`center-orders:${centerId}`, "center-orders", { column: "service_center_id", value: centerId }, onChange);
}