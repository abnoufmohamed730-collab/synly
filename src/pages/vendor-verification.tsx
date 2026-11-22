import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";

const vendorDocs = [{ type: "commercial_register", key: "verification.commercialRegister" }, { type: "tax_id", key: "verification.taxId" }] as const;
const userDocs = [{ type: "car_license", key: "verification.carLicense" }, { type: "national_id", key: "verification.nationalId" }] as const;

export function VendorVerificationPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const verified = user?.verified ?? false;
  const [hasSignupIntent] = useState(() => Boolean(localStorage.getItem("synly-verification-intent")));
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [busy, setBusy] = useState(false);
  const requiredDocs = user?.role === "vendor" ? vendorDocs : userDocs;

  const submit = async () => {
    if (!user || requiredDocs.some(({ type }) => !files[type])) return;
    setBusy(true);
    try {
      for (const { type } of requiredDocs) {
        const file = files[type]!;
        if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error(t("verification.fileError"));
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${user.id}/${type}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("verification-docs").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        const { error: rowError } = await supabase.from("verification_documents").insert({ user_id: user.id, doc_type: type, storage_path: path });
        if (rowError) throw new Error(rowError.message);
      }
      setFiles({});
      localStorage.removeItem("synly-verification-intent");
      toast.success(t("verification.submitted"));
      await supabase.auth.refreshSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("verification.submitError"));
    } finally {
      setBusy(false);
    }
  };

  const title = user?.role === "vendor" ? verified ? t("verification.verifiedTitle") : t("verification.pendingTitle") : t("verification.identityTitle");
  const description = user?.role === "vendor" ? verified ? t("verification.approvedDescription") : t("verification.vendorDescription") : t("verification.userDescription");
  return <div className="mx-auto max-w-3xl space-y-6 text-start">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">{t("verification.eyebrow")}</p><h1 className="mt-2 text-3xl font-bold">{title}</h1><p className="mt-2 text-muted-foreground">{description}</p></div>
    {!verified && <Card className="glass-card rounded-2xl border-white/10"><CardHeader><CardTitle>{t("verification.submitTitle")}</CardTitle></CardHeader><CardContent className="space-y-5">{hasSignupIntent && <p className="text-sm text-muted-foreground">{t("verification.signupNotice")}</p>}{requiredDocs.map(({ type, key }) => <label key={type} className="block space-y-2 text-sm font-medium">{t(key)}<input type="file" accept="image/jpeg,image/png,application/pdf" className="block w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm" onChange={(event) => setFiles((current) => ({ ...current, [type]: event.target.files?.[0] ?? null }))} /></label>)}<p className="text-xs text-muted-foreground">{t("verification.fileRequirements")}</p><Button disabled={busy || requiredDocs.some(({ type }) => !files[type])} onClick={submit} className="rounded-xl">{busy ? t("verification.uploading") : t("verification.submit")}</Button></CardContent></Card>}
  </div>;
}
