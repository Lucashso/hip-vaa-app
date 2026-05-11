// InvoiceAlert — banner amarelo/vermelho compacto no topo de páginas do aluno.
// Aparece se houver fatura vencendo em <= 3 dias OU em atraso.

import { useNavigate } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { formatBRL } from "@/lib/utils";
import type { Invoice } from "@/hooks/useStudent";

interface Props {
  invoice: Invoice | null;
  daysUntilDue: number | null;
  isOverdue: boolean;
  daysOverdue?: number;
  onPayClick?: () => void;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export function InvoiceAlert({
  invoice,
  daysUntilDue,
  isOverdue,
  daysOverdue = 0,
  onPayClick,
}: Props) {
  const navigate = useNavigate();

  if (!invoice) return null;

  // Critério: mostra se vence em <= 3 dias ou já está em atraso.
  if (!isOverdue && daysUntilDue !== null && daysUntilDue > 3) return null;
  if (invoice.status === "paid" || invoice.status === "cancelled") return null;

  const tone = isOverdue ? "danger" : "warn";
  const bgClass =
    tone === "danger"
      ? "bg-hv-coral/12 border-hv-coral/40"
      : "bg-hv-amber/15 border-hv-amber/45";
  const iconColor =
    tone === "danger" ? "hsl(var(--hv-coral))" : "hsl(var(--hv-amber))";

  let message: string;
  if (isOverdue) {
    message =
      daysOverdue > 0
        ? `Em atraso há ${daysOverdue} ${plural(daysOverdue, "dia", "dias")}`
        : "Em atraso";
  } else if (daysUntilDue === 0) {
    message = "Vence hoje";
  } else if (daysUntilDue === 1) {
    message = "Vence amanhã";
  } else {
    message = `Vence em ${daysUntilDue} dias`;
  }

  function handleClick() {
    if (onPayClick) onPayClick();
    else navigate("/plano");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-[14px] border ${bgClass} px-4 py-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform`}
    >
      <div
        className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
        style={{ background: `${iconColor}22`, color: iconColor }}
      >
        <HVIcon name="wallet" size={18} stroke={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-hv-text-2 truncate">
          {invoice.description || "Mensalidade"}
        </div>
        <div
          className="font-display text-[14px] font-extrabold truncate"
          style={{ color: iconColor }}
        >
          {formatBRL(invoice.amount_cents)} · {message}
        </div>
      </div>
      <HVIcon name="chevron-right" size={18} color="hsl(var(--hv-text-3))" />
    </button>
  );
}
