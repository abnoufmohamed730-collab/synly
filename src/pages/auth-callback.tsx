import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const description = new URLSearchParams(window.location.search).get("error_description");
    if (description) {
      setError(description);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      const role = session.user.user_metadata?.role === "vendor" ? "vendor" : "user";
      navigate(role === "vendor" ? "/dashboard" : "/user", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#090A0F] text-white flex items-center justify-center p-6">
      <div className="glass-card max-w-md rounded-3xl border border-white/10 p-8 text-center">
        <h1 className="text-2xl font-bold">{error ? "Sign-in link could not be completed" : "Confirming your account"}</h1>
        <p className="mt-3 text-sm text-slate-300">
          {error || "Your secure session is being restored. This page will continue automatically."}
        </p>
        {error && <Link to="/login" className="mt-5 inline-block font-semibold text-orange-300 hover:text-orange-200">Return to sign in</Link>}
      </div>
    </main>
  );
}
