import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/language-context";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type VerificationDocument = { id: string; user_id: string; doc_type: string; storage_path: string; status: string; notes: string | null; created_at: string };

export function AdminVerificationReviewPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("verification_documents").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setDocuments((data ?? []) as VerificationDocument[]);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const openDocument = async (path: string) => {
    const { data, error } = await supabase.storage.from("verification-docs").createSignedUrl(path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const review = async (doc: VerificationDocument, status: "approved" | "rejected") => {
    setBusy(doc.id);
    const { error } = await supabase.rpc("review_vendor_verification", { p_document_id: doc.id, p_status: status, p_notes: null });
    if (error) toast.error(error.message);
    else { toast.success(t("admin.documentStatus", { status: t(`verification.status.${status}`) })); await refresh(); }
    setBusy(null);
  };

  return <div className="space-y-6 text-start"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">{t("admin.eyebrow")}</p><h1 className="mt-2 text-3xl font-bold">{t("admin.title")}</h1><p className="mt-2 text-muted-foreground">{t("admin.description")}</p></div><div className="space-y-3">{documents.map((doc) => <Card key={doc.id} className="glass-card rounded-2xl border-white/10"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="text-lg">{doc.doc_type.replace(/_/g, " ")}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{t("admin.vendor", { id: doc.user_id })} · {doc.status}</p></div><Button variant="outline" className="rounded-xl" onClick={() => void openDocument(doc.storage_path)}><ExternalLink className="me-2 h-4 w-4" />{t("admin.openFile")}</Button></CardHeader><CardContent className="flex gap-3">{doc.status === "pending" && <><Button disabled={busy === doc.id} className="rounded-xl" onClick={() => void review(doc, "approved")}>{t("admin.approve")}</Button><Button disabled={busy === doc.id} variant="destructive" className="rounded-xl" onClick={() => void review(doc, "rejected")}>{t("admin.reject")}</Button></>}</CardContent></Card>)}{documents.length === 0 && <Card className="glass-card rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">{t("admin.noDocuments")}</CardContent></Card>}</div></div>;
}
