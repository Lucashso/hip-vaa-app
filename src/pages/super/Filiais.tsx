// SuperAdmin · Filiais — fiel ao Hip.zip super.jsx HVSuperFiliais.
// Cards de filial com hero gradient + comparativo de royalty + matriz autonomia.

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { HVIcon } from "@/lib/HVIcon";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { cn, formatBRL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface TenantRow {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
  is_test: boolean;
  students_count?: number;
  contract?: {
    royalty_percentage: number | null;
    royalty_fixed_cents: number | null;
    franchise_fee_cents: number | null;
    marketing_fee_percentage: number | null;
  } | null;
}

function useFiliais() {
  return useQuery({
    queryKey: ["super", "filiais"],
    queryFn: async (): Promise<TenantRow[]> => {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name, slug, active, is_test")
        .order("created_at", { ascending: true });

      const list = (tenants || []).filter((t) => !t.is_test);
      const ids = list.map((t) => t.id);

      const counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("tenant_id")
          .in("tenant_id", ids);
        (students || []).forEach((s) => {
          counts[s.tenant_id] = (counts[s.tenant_id] || 0) + 1;
        });
      }

      const contracts: Record<string, TenantRow["contract"]> = {};
      if (ids.length > 0) {
        const { data: rows } = await supabase
          .from("franchise_contracts")
          .select("tenant_id, royalty_percentage, royalty_fixed_cents, franchise_fee_cents, marketing_fee_percentage")
          .in("tenant_id", ids);
        (rows || []).forEach((r) => {
          contracts[r.tenant_id] = r as TenantRow["contract"];
        });
      }

      return list.map((t) => ({
        ...t,
        students_count: counts[t.id] || 0,
        contract: contracts[t.id] || null,
      }));
    },
  });
}

const CARD_GRADS = [
  "linear-gradient(135deg, hsl(var(--hv-ink)), hsl(var(--hv-cyan)))",
  "linear-gradient(135deg, hsl(var(--hv-blue)), hsl(var(--hv-cyan)))",
  "linear-gradient(135deg, hsl(var(--hv-cyan)), hsl(var(--hv-blue)))",
  "linear-gradient(135deg, hsl(var(--hv-leaf)), hsl(var(--hv-cyan)))",
];

export default function SuperFiliais() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: filiais = [], isLoading } = useFiliais();

  if (isLoading) return <Loader />;

  const matriz = filiais[0];
  const totalAlunos = filiais.reduce((s, f) => s + (f.students_count || 0), 0);
  const totalMRR = filiais.reduce((s, f) => s + (f.contract?.royalty_fixed_cents || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="bg-hv-surface border-b border-hv-line sticky top-0 z-30">
        <div className="px-5 lg:px-7 py-3.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] tracking-[0.14em] text-hv-text-3 font-semibold uppercase">
              REDE / FILIAIS · CONSOLE DA SEDE
            </div>
            <h1 className="font-display font-bold text-[20px] leading-tight">
              Filiais da rede
            </h1>
            <div className="text-[12px] text-hv-text-2 mt-0.5">
              Modelo franquia · {filiais.length} unidades · cada filial com regras próprias
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/rede/nova")}>
            <HVIcon name="plus" size={14} stroke={2.4} /> Nova filial
          </Button>
          <Button size="sm" variant="ghost" onClick={() => signOut()}>
            <HVIcon name="logout" size={14} />
          </Button>
        </div>
      </header>

      <main className="px-4 lg:px-7 py-5 lg:py-8 space-y-5 lg:space-y-7">
        {/* Cards de filiais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filiais.length === 0 ? (
            <div className="col-span-full hv-card p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-hv-foam grid place-items-center mx-auto">
                <HVIcon name="compass" size={22} color="hsl(var(--hv-navy))" />
              </div>
              <p className="mt-3 text-[13px] text-hv-text-2 font-medium">
                Nenhuma filial ativa ainda.
              </p>
            </div>
          ) : (
            filiais.map((f, i) => {
              const isMatriz = f.id === matriz?.id;
              const royaltyLabel =
                f.contract?.royalty_percentage != null
                  ? `${f.contract.royalty_percentage}%`
                  : f.contract?.royalty_fixed_cents
                  ? formatBRL(f.contract.royalty_fixed_cents)
                  : "—";

              return (
                <div key={f.id} className="hv-card overflow-hidden">
                  <div
                    className="h-[88px] relative"
                    style={{ background: CARD_GRADS[i % CARD_GRADS.length] }}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 320 88"
                      preserveAspectRatio="none"
                      className="w-full h-full"
                    >
                      <path d="M0 60 Q 80 40 160 60 T 320 60 L 320 88 L 0 88Z" fill="rgba(255,255,255,0.2)" />
                      <path d="M0 75 Q 80 55 160 75 T 320 75 L 320 88 L 0 88Z" fill="rgba(255,255,255,0.32)" />
                    </svg>
                    <span
                      className="absolute top-3 left-3.5 text-[9px] font-extrabold px-2 py-0.5 rounded font-mono tracking-wider"
                      style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
                    >
                      {isMatriz ? "MATRIZ" : "FRANQUIA"}
                    </span>
                    <span
                      className="absolute top-3 right-3.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(255,255,255,0.9)", color: "hsl(var(--hv-text))" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: f.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-amber))",
                        }}
                      />
                      {f.active ? "Operação ok" : "Inativa"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-display text-[16px]">{f.name}</h3>
                    <div className="text-[11px] text-hv-text-3 mt-0.5">
                      Slug: <b className="text-hv-text-2 font-mono">{f.slug || "—"}</b>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3.5">
                      <div className="px-2.5 py-2 rounded-[8px] bg-background">
                        <div className="font-mono text-[9px] text-hv-text-3 tracking-wider font-bold">
                          ALUNOS
                        </div>
                        <div className="font-display font-extrabold text-[16px] mt-0.5 text-hv-navy">
                          {f.students_count}
                        </div>
                      </div>
                      <div className="px-2.5 py-2 rounded-[8px] bg-background">
                        <div className="font-mono text-[9px] text-hv-text-3 tracking-wider font-bold">
                          ROYALTY
                        </div>
                        <div className="font-display font-extrabold text-[16px] mt-0.5 text-hv-leaf">
                          {royaltyLabel}
                        </div>
                      </div>
                      <div className="px-2.5 py-2 rounded-[8px] bg-background">
                        <div className="font-mono text-[9px] text-hv-text-3 tracking-wider font-bold">
                          STATUS
                        </div>
                        <div className="font-display font-extrabold text-[16px] mt-0.5 text-hv-blue">
                          {isMatriz ? "Matriz" : "Ativa"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3.5">
                      <Button variant="ghost" size="sm" className="flex-1">
                        Detalhes
                      </Button>
                      <Button size="sm" className="flex-1">
                        Entrar como admin
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comparativo + autonomia */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="hv-card overflow-hidden lg:col-span-2">
            <div className="px-[18px] py-3.5 border-b border-hv-line">
              <h3 className="font-display text-[14px]">Comparativo da rede</h3>
              <div className="text-[11px] text-hv-text-3 mt-0.5">
                Cada linha é uma franquia · regras próprias de preço, plano e split de royalty
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-background">
                  <tr>
                    {["Filial", "Royalty", "Marketing", "Alunos", "MRR estimado"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-[18px] py-2.5 font-semibold text-hv-text-3 uppercase tracking-[0.1em] text-[10px] font-mono"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filiais.map((f) => {
                    const royaltyLabel =
                      f.contract?.royalty_percentage != null
                        ? `${f.contract.royalty_percentage}%`
                        : f.contract?.royalty_fixed_cents
                        ? formatBRL(f.contract.royalty_fixed_cents)
                        : "—";
                    const isMatriz = f.id === matriz?.id;
                    return (
                      <tr key={f.id} className="border-t border-hv-line">
                        <td className="px-[18px] py-3 font-semibold">{f.name}</td>
                        <td className="px-[18px] py-3">
                          {isMatriz ? (
                            <span className="text-[11px] text-hv-text-3">matriz</span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.04em]"
                              style={{
                                background: "hsl(var(--hv-cyan) / 0.16)",
                                color: "hsl(var(--hv-blue))",
                              }}
                            >
                              {royaltyLabel}
                            </span>
                          )}
                        </td>
                        <td className="px-[18px] py-3 text-hv-text-2 font-mono">
                          {f.contract?.marketing_fee_percentage != null
                            ? `${f.contract.marketing_fee_percentage}%`
                            : "—"}
                        </td>
                        <td className="px-[18px] py-3 text-hv-text-2 font-mono">
                          {f.students_count}
                        </td>
                        <td className="px-[18px] py-3 font-display font-bold">
                          {f.contract?.royalty_fixed_cents
                            ? formatBRL(f.contract.royalty_fixed_cents)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="hv-card p-[18px]">
            <h3 className="font-display text-[14px]">Autonomia da franquia</h3>
            <div className="text-[11px] text-hv-text-3 mb-3.5">
              O que cada admin de filial pode mudar
            </div>
            {[
              { l: "Preços de mensalidade", on: true },
              { l: "Turmas, horários e instrutores", on: true },
              { l: "Loja e estoque local", on: true },
              { l: "Passeios próprios da unidade", on: true },
              { l: "Identidade visual & logo", on: false },
              { l: "Regras de royalty/split", on: false },
              { l: "Criar nova filial", on: false },
            ].map((p, i, arr) => (
              <div
                key={p.l}
                className={cn(
                  "flex items-center gap-2.5 py-2",
                  i < arr.length - 1 && "border-b border-dashed border-hv-line",
                )}
              >
                <span
                  className="w-[22px] h-[22px] rounded-full grid place-items-center shrink-0"
                  style={{
                    background: p.on ? "hsl(var(--hv-leaf) / 0.15)" : "hsl(var(--hv-coral) / 0.12)",
                    color: p.on ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-coral))",
                  }}
                >
                  <HVIcon name={p.on ? "check" : "x"} size={12} stroke={3} />
                </span>
                <span className="text-[12px] flex-1">{p.l}</span>
                <span
                  className="font-mono text-[9px] font-bold tracking-wider"
                  style={{
                    color: p.on ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-text-3))",
                  }}
                >
                  {p.on ? "FILIAL" : "REDE"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo rede */}
        <div className="hv-card p-[18px]">
          <h3 className="font-display text-[14px] mb-3">Resumo da rede</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "FILIAIS", v: String(filiais.length), c: "hsl(var(--hv-navy))" },
              { l: "ATLETAS TOTAL", v: String(totalAlunos), c: "hsl(var(--hv-blue))" },
              { l: "ROYALTY FIXO/MÊS", v: formatBRL(totalMRR), c: "hsl(var(--hv-leaf))" },
              { l: "OPERAÇÕES OK", v: String(filiais.filter((f) => f.active).length), c: "hsl(var(--hv-cyan))" },
            ].map((s) => (
              <div key={s.l} className="px-3 py-2.5 rounded-[10px] bg-background">
                <div className="font-mono text-[9px] text-hv-text-3 tracking-wider font-bold">
                  {s.l}
                </div>
                <div
                  className="font-display font-extrabold text-[20px] mt-0.5"
                  style={{ color: s.c }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
