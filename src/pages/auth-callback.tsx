import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useLanguage } from "../context/language-context";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [error, setError] = useState("");

  useEffect(() => {
    const description = new URLSearchParams(window.location.search).get("error_description");
    if (description) {
      setError(description);
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      void supabase.from("profiles").select("role").eq("user_id", session.user.id).single().then(({ data }) => {
        if (!active || !data) return;
        const destination = data.role === "admin" ? "/admin/verification" : data.role === "vendor" ? "/dashboard" : "/user";
        navigate(destination, { replace: true });
      });
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-6">
      <div className="glass-card max-w-md rounded-3xl border border-white/10 p-8 text-center">
        <h1 className="text-2xl font-bold">{error ? t("ops.callbackError") : t("ops.accountCallback")}</h1>
        <p className="mt-3 text-sm text-slate-300">
          {error || t("ops.callbackWait")}
        </p>
        {error && <Link to="/login" className="mt-5 inline-block font-semibold text-orange-300 hover:text-orange-200">{t("ops.returnSignIn")}</Link>}
      </div>
    </main>
  );
}