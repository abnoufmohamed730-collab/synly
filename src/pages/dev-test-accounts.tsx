import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, LoaderCircle, ShieldAlert, UserRound, Wrench } from "lucide-react";

interface SeedResult {
  message: string;
  customer: { email: string; password: string };
  vendor: { email: string; password: string };
  center: { id: string; latitude: number; longitude: number; address: string };
}

export function DevTestAccountsPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<SeedResult | null>(null);
  const [loading, setLoading] = useState(false);

  const createTestAccounts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("seed-test-accounts", {
        body: {},
        headers: { "x-synly-seed-token": token },
      });
      if (error) throw new Error(data?.error || error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data as SeedResult);
      toast.success("Development test accounts and fixture are ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the test accounts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090A0F] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200"><ShieldAlert className="h-3.5 w-3.5" />Development-only seeding</div>
          <h1 className="text-3xl font-bold">Synly Phase 2 test accounts</h1>
          <p className="text-sm text-slate-300">Sign in to an existing development account first. This page creates or resets two test accounts, linked vehicle/contact data, an approved always-open center, and a pending towing request ready for vendor offers.</p>
        </header>

        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><KeyRound className="h-5 w-5 text-blue-300" />Seed access token</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createTestAccounts} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="seed-token">Development seed token</Label><Input id="seed-token" type="password" autoComplete="off" minLength={32} required value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste SYNLY_TEST_SEED_TOKEN" className="glass-input" /><p className="text-xs text-slate-400">Set this secret and SYNLY_TEST_SEED_ENABLED=true in the connected development Supabase project's Edge Functions → Manage Secrets.</p></div>
              <Button type="submit" disabled={loading || token.length < 32} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">{loading ? <LoaderCircle className="me-2 h-4 w-4 animate-spin" /> : <KeyRound className="me-2 h-4 w-4" />}{loading ? "Preparing test data…" : "Create / reset test accounts"}</Button>
            </form>
          </CardContent>
        </Card>

        {result && <>
          <p className="rounded-xl border border-green-400/20 bg-green-400/5 p-4 text-sm text-green-200">{result.message}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <CredentialCard title="Regular user" icon={<UserRound className="h-5 w-5 text-blue-300" />} email={result.customer.email} password={result.customer.password} />
            <CredentialCard title="Service center / vendor" icon={<Wrench className="h-5 w-5 text-orange-300" />} email={result.vendor.email} password={result.vendor.password} />
          </div>
          <Card className="glass-card border-white/10"><CardContent className="space-y-2 p-5 text-sm"><p className="font-semibold text-white">Seed center location</p><p className="text-slate-300">{result.center.address}</p><p className="font-mono text-xs text-slate-400">{result.center.latitude}, {result.center.longitude}</p><p className="text-xs text-amber-200">These are approximate Moharam Bek neighborhood coordinates, not a reading of your device's GPS position.</p></CardContent></Card>
          <p className="text-xs text-slate-400">The user account already has a pending emergency towing request. Sign into the vendor account and submit an offer, then sign into the user account to accept it and exercise request tracking. Each new seed run rotates both passwords and replaces the prior seeded request.</p>
        </>}
      </div>
    </main>
  );
}

function CredentialCard({ title, icon, email, password }: { title: string; icon: React.ReactNode; email: string; password: string }) {
  return <Card className="glass-card border-white/10"><CardHeader><CardTitle className="flex items-center gap-2 text-white">{icon}{title}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div><p className="text-xs text-slate-400">Email</p><p className="select-all font-mono text-blue-100">{email}</p></div><div><p className="text-xs text-slate-400">Password (shown once per seed run)</p><p className="select-all break-all font-mono text-orange-200">{password}</p></div></CardContent></Card>;
}
