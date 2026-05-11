// Plano — plano atual + próxima cobrança (PIX modal + polling) + histórico + cartões salvos.

import { useState } from "react";
import { PageScaffold } from "@/components/PageScaffold";
import { useMyStudent, useMyInvoices, type Invoice } from "@/hooks/useStudent";
import { useUpcomingStudentInvoice } from "@/hooks/useStudentHome";
import { HVIcon } from "@/lib/HVIcon";
import { cn, formatBRL } from "@/lib/utils";
import { InvoiceAlert } from "@/components/Alerts/InvoiceAlert";
import { PixPaymentModal } from "@/components/Student/PixPaymentModal";
import { SavedCardsManager } from "@/components/Student/SavedCardsManager";
import { toast } from "sonner";

type Status = Invoice["status"];

function statusInfo(
  status: Status,
  overdue: boolean,
): { label: string; className: string } {
  if (status === "paid")
    return { label: "PAGO", className: "bg-hv-leaf/15 text-hv-leaf" };
  if (status === "cancelled")
    return { label: "CANCELADO", className: "bg-hv-line text-hv-text-3" };
  if (overdue || status === "overdue")
    return { label: "ATRASADO", className: "bg-hv-coral/15 text-hv-coral" };
  return { label: "PENDENTE", className: "bg-hv-amber/20 text-hv-amber" };
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
  const { data: nextInvoice = null } = useUpcomingStudentInvoice(student?.id);
  const [pixInvoice, setPixInvoice] = useState<Invoice | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const planName = student?.plan?.name || "Plano";
  const planPrice = student?.plan?.price_cents ?? 0;
  const planType = student?.plan?.type || "monthly";

  const nextOverdue =
    nextInvoice &&
    nextInvoice.status !== "paid" &&
    new Date(nextInvoice.due_date) < today;

  const daysUntilDue = nextInvoice
    ? Math.floor(
        (new Date(nextInvoice.due_date).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const daysOverdue =
    nextOverdue && nextInvoice
      ? Math.floor(
          (today.getTime() - new Date(nextInvoice.due_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  function openPix(invoice: Invoice) {
    setPixInvoice(invoice);
  }

  return (
    <PageScaffold eyebrow="SEU EXTRATO" title="Financeiro">
      <InvoiceAlert
        invoice={nextInvoice}
        daysUntilDue={daysUntilDue}
        isOverdue={!!nextOverdue}
        daysOverdue={daysOverdue}
        onPayClick={() => nextInvoice && openPix(nextInvoice)}
      />

      {/* Plano atual */}
      <div className="hv-card p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-[14px] bg-hv-foam grid place-items-center text-hv-navy">
          <HVIcon name="paddle" size={22} stroke={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="hv-eyebrow">PLANO ATUAL</div>
          <div className="font-display text-[18px] mt-0.5 truncate">{planName}</div>
          {planPrice > 0 && (
            <div className="text-[11px] text-hv-text-3 mt-0.5">
              {formatBRL(planPrice)} /{" "}
              {planType === "annual"
                ? "ano"
                : planType === "drop_in"
                  ? "avulso"
                  : "mês"}
            </div>
          )}
        </div>
      </div>

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

          {nextInvoice ? (
            <>
              <div className="font-display font-extrabold text-[44px] leading-none mt-3 text-white">
                {formatBRL(nextInvoice.amount_cents)}
              </div>
              <div className="text-xs mt-2 text-white/70">
                Vence em {formatDate(nextInvoice.due_date)}
                {nextOverdue ? " · em atraso" : ""}
              </div>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => openPix(nextInvoice)}
                  className="flex-1 h-12 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.97]"
                >
                  <HVIcon name="qr" size={16} stroke={2.2} /> Pagar com PIX
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const boletoUrl = (nextInvoice as unknown as { url_boleto?: string }).url_boleto;
                    if (boletoUrl) {
                      window.open(boletoUrl, "_blank");
                    } else {
                      toast.info("Boleto indisponível");
                    }
                  }}
                  className="h-12 px-4 rounded-[14px] text-white font-semibold text-[13px]"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  Boleto
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

      {/* Cartões salvos */}
      {student?.id && (
        <div>
          <h3 className="hv-eyebrow mb-2">CARTÕES SALVOS</h3>
          <SavedCardsManager
            studentId={student.id}
            onAddCard={() =>
              toast.info("Cadastro de cartão será habilitado em breve")
            }
          />
        </div>
      )}

      {/* Histórico de faturas */}
      <div>
        <h3 className="hv-eyebrow mb-2">HISTÓRICO</h3>
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
              const canPay = inv.status === "pending" || inv.status === "overdue";
              return (
                <div
                  key={inv.id}
                  className="hv-card p-4 flex items-center gap-3"
                >
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
                    {canPay && (
                      <button
                        type="button"
                        onClick={() => openPix(inv)}
                        className="text-[11px] font-semibold text-hv-blue hover:underline"
                      >
                        Pagar →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pixInvoice && (
        <PixPaymentModal
          open={!!pixInvoice}
          onClose={() => setPixInvoice(null)}
          amountCents={pixInvoice.amount_cents}
          description={pixInvoice.description || planName}
          invoiceId={pixInvoice.id}
          initialQr={pixInvoice.pix_qr}
          initialQrBase64={pixInvoice.pix_qr_base64}
        />
      )}
    </PageScaffold>
  );
}
