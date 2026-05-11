// AssinarSucesso — tela final pós-pagamento confirmado.
// Mostra mensagem de boas-vindas + URL da filial + CTA pra logar.

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { supabase } from "@/lib/supabase";

interface LocationState {
  tenant_id?: string;
  company_name?: string;
  planName?: string;
}

export default function AssinarSucesso() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSlug() {
      if (!state.tenant_id) return;
      const { data } = await supabase
        .from("tenants")
        .select("slug")
        .eq("id", state.tenant_id)
        .maybeSingle();
      if (cancelled) return;
      setSlug(data?.slug ?? null);
    }
    loadSlug();
    return () => {
      cancelled = true;
    };
  }, [state.tenant_id]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
      <div className="w-20 h-20 rounded-full bg-hv-foam grid place-items-center mb-5">
        <HVIcon
          name="check"
          size={42}
          color="hsl(var(--hv-leaf))"
          stroke={2.4}
        />
      </div>
      <h1 className="font-display text-[28px] text-hv-navy">
        Bem-vindo à Hip Va'a!
      </h1>
      <p className="text-[14px] text-hv-text-2 mt-2 max-w-[360px]">
        Pagamento confirmado e sua filial{" "}
        {state.company_name ? <strong>{state.company_name}</strong> : "—"} está
        no ar. Enviamos por email a senha de acesso do administrador.
      </p>

      {slug && (
        <div
          className="mt-5 px-4 py-3 rounded-[12px] border border-hv-line bg-hv-surface"
          style={{ background: "hsl(var(--hv-foam))" }}
        >
          <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.16em]">
            SEU DOMÍNIO
          </div>
          <div className="font-display text-[16px] font-bold text-hv-navy mt-1">
            hipvaa.app/{slug}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/auth", { replace: true })}
        className="mt-7 h-12 px-6 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center gap-2 active:scale-[0.97] transition-transform"
      >
        Entrar como admin
        <HVIcon name="arrow-right" size={16} stroke={2.4} />
      </button>

      <p className="text-[11px] text-hv-text-3 mt-4 max-w-[340px]">
        Use o e-mail cadastrado e a senha que enviamos.
      </p>
    </div>
  );
}
