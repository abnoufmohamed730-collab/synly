import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/auth-context";
import { supabase } from "../integrations/supabase/client";
import { useLanguage } from "../context/language-context";

type NotificationRecord = {
  id: string;
  event_type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,event_type,title,message,entity_type,entity_id,read_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (active && !error) setItems(data ?? []);
    };
    void load();

    const channel = supabase
      .channel(`notifications:${user.id}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        ({ new: row }) => {
          const notification = row as NotificationRecord;
          setItems((current) => [notification, ...current].slice(0, 30));
          toast(notification.title, { description: notification.message });
        },
      )
      .subscribe();

    return () => {
      active = false;
      void (async () => {
        await supabase.removeChannel(channel);
      })();
    };
  }, [user?.id]);

  const markRead = async (item: NotificationRecord) => {
    if (item.read_at) return;
    const readAt = new Date().toISOString();
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, read_at: readAt } : entry)));
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", item.id);
    if (error) toast.error(t("ops.markReadError"));
  };

  const unread = items.filter((item) => !item.read_at).length;
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("common.notifications")}
                onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl border border-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <button
            aria-label={t("common.close")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute end-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="font-semibold text-white">{t("ops.notifications")}</p>
                                <p className="text-xs text-slate-400">{t("ops.liveUpdates")}</p>
              </div>
              <CheckCheck className="h-4 w-4 text-blue-300" />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">{t("ops.allCaughtUp")}</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => void markRead(item)}
                    className={`block w-full border-b border-white/5 px-4 py-3 text-start transition-colors hover:bg-white/5 ${item.read_at ? "opacity-70" : "bg-blue-500/[0.06]"}`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-white">{item.title}</span>
                      {!item.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-400" />}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">{item.message}</span>
                    <span className="mt-2 block text-[10px] text-slate-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}