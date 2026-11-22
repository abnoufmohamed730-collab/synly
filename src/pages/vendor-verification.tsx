import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";

const vendorDocs = [
  { type: "commercial_register", label: "Commercial register" },
  { type: "tax_id", label: "Tax ID" },
] as const;
const userDocs = [
  { type: "car_license", label: "Car license" },
  { type: "national_id", label: "National ID" },
] as const;

export function VendorVerificationPage() {
  const { user } = useAuth();
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
        if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 5 * 1024 * 1024) {
          throw new Error("Choose a JPEG, PNG, or PDF file up to 5 MB.");
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${user.id}/${type}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("verification-docs").upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        const { error: rowError } = await supabase.from("verification_documents").insert({ user_id: user.id, doc_type: type, storage_path: path });
        if (rowError) throw new Error(rowError.message);
      }
      setFiles({});
      localStorage.removeItem("synly-verification-intent");
      toast.success("Documents submitted for review.");
      await supabase.auth.refreshSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit documents.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-3xl space-y-6 text-start">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Account documents</p><h1 className="mt-2 text-3xl font-bold">{user?.role === "vendor" && verified ? "Your center is verified" : user?.role === "vendor" ? "Pending verification" : "Identity documents"}</h1><p className="mt-2 text-muted-foreground">{user?.role === "vendor" ? verified ? "Your business documents have been approved." : "Submit your business documents after signing in. Your center stays offline until approved." : "Submit your vehicle and identity documents securely after signing in."}</p></div>
    {!verified && <Card className="glass-card rounded-2xl border-white/10"><CardHeader><CardTitle>Submit documents</CardTitle></CardHeader><CardContent className="space-y-5">{hasSignupIntent && <p className="text-sm text-muted-foreground">Your registration requested business verification. Sign in and reselect the files here to securely upload them.</p>}{requiredDocs.map(({ type, label }) => <label key={type} className="block space-y-2 text-sm font-medium">{label}<input type="file" accept="image/jpeg,image/png,application/pdf" className="block w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm" onChange={(event) => setFiles((current) => ({ ...current, [type]: event.target.files?.[0] ?? null }))} /></label>)}<p className="text-xs text-muted-foreground">JPEG, PNG, or PDF · maximum 5 MB per file</p><Button disabled={busy || requiredDocs.some(({ type }) => !files[type])} onClick={submit} className="rounded-xl">{busy ? "Uploading…" : "Submit for review"}</Button></CardContent></Card>}
  </div>;
}
