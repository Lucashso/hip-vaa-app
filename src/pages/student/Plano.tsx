// Plano — hero próxima cobrança + lista de faturas.

import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyInvoices, type Invoice } from "@/hooks/useStudent";
import { HVIcon } from "@/lib/HVIcon";
import { cn, formatBRL } from "@/lib/utils";

type Status = Invoice["status"];

function statusInfo(status: Status, overdue: boolean): {
  label: string;
  className: string;
} {
  if (status === "paid") {
    return {
      label: "PAGO",
      className: "bg-hv-leaf/15 text-hv-leaf",
    };
  }
  if (status === "cancelled") {
    return {
      label: "CANCELADO",
      className: "bg-hv-line text-hv-text-3",
    };
  }
  if (overdue || status === "overdue") {
    return {
      label: "ATRASADO",
      className: "bg-hv-coral/15 text-hv-coral",
    };
  }
  return {
    label: "PENDENTE",
    className: "bg-hv-amber/20 text-hv-amber",
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StudentPlano() {
  const { data: student } = useMyStudent();
  const { data: invoices = [] } = useMyInvoices(student?.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next = invoices.find((i) => i.status === "pending" || i.status === "overdue");
  const nextOverdue =
    next && new Date(next.due_date) < today && next.status !== "paid";
  const planName = student?.plan?.name || "Plano";

  return (
    <PageScaffold eyebrow="SEU EXTRATO" title="Financeiro">
      {/* Hero próxima cobrança */}
      <div
        className="relative overflow-hidden rounded-[22px] text-white p-5"
        style={{
          background:
            "linear-gradient(155deg, hsl(var(--hv-ink)) 0%, hsl(var(--hv-navy)) 60%, hsl(var(--hv-blue)) 100%)",
          minHeight: 220,
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 360 220"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <path
            d="M0 170 Q 90 150 180 170 T 360 170 L 360 220 L 0 220Z"
            fill="hsl(var(--hv-cyan) / 0.15)"
          />
          <path
            d="M0 190 Q 90 170 180 190 T 360 190 L 360 220 L 0 220Z"
            fill="hsl(var(--hv-cyan) / 0.22)"
          />
        </svg>

        <div className="relative">
          <div className="hv-eyebrow text-white/70">PRÓXIMA COBRANÇA</div>
          <div className="text-sm mt-1 text-white/85">{planName}</div>

          {next ? (
            <>
              <div className="font-display font-extrabold text-[44px] leading-none mt-3 text-white">
                {formatBRL(next.amount_cents)}
              </div>
              <div className="text-xs mt-2 text-white/70">
                Vence em {formatDate(next.due_date)}
                {nextOverdue ? " · em atraso" : ""}
              </div>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  className="flex-1 h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.97]"
                >
                  <HVIcon name="zap" size={16} stroke={2.2} /> Pagar agora
                </button>
                <button
                  type="button"
                  className="h-12 px-4 rounded-[14px] text-white font-semibold text-[13px]"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  Ver fatura
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6">
              <div className="font-display text-[28px] text-white leading-tight">
                Tudo em dia.
              </div>
              <div className="text-sm text-white/70 mt-2">
                Sem cobranças pendentes no momento.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de faturas */}
      <div>
        <h3 className="hv-eyebrow mb-2">Histórico</h3>
        {invoices.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2">
            Nenhuma fatura registrada.
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => {
              const overdue =
                inv.status !== "paid" &&
                inv.status !== "cancelled" &&
                new Date(inv.due_date) < today;
              const info = statusInfo(inv.status, overdue);
              return (
                <div key={inv.id} className="hv-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-hv-foam grid place-items-center text-hv-navy">
                    <HVIcon name="wallet" size={18} stroke={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[14px] truncate">
                      {inv.description || planName}
                    </div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5">
                      {inv.status === "paid" && inv.paid_at
                        ? `Pago em ${formatDate(inv.paid_at)}`
                        : `Venc. ${formatDate(inv.due_date)}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="font-mono text-[13px] font-bold text-foreground">
                      {formatBRL(inv.amount_cents)}
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                        info.className,
                      )}
                    >
                      {info.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
