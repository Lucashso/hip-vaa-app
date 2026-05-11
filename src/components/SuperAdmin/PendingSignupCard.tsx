// PendingSignupCard — card que mostra um pré-cadastro de nova filial com botões aprovar/rejeitar.

import { useState } from "react";
import { HVIcon } from "@/lib/HVIcon";
import { ConfirmDialog } from "@/components/Modal";
import { useApprovePendingSignup, useRejectPendingSignup, type PendingTenantSignup } from "@/hooks/usePendingTenantSignups";

interface Props {
  signup: PendingTenantSignup;
}

export function PendingSignupCard({ signup }: Props) {
  const approve = useApprovePendingSignup();
  const reject = useRejectPendingSignup();
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  const isLoading = approve.isPending || reject.isPending;

  return (
    <>
      <div className="hv-card p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-[10px] grid place-items-center shrink-0 font-display font-extrabold text-sm text-white"
            style={{ background: "hsl(var(--hv-blue))" }}
          >
            {(signup.name || "?")[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[14px] truncate">
              {signup.name || "—"}
            </div>
            <div className="text-[11px] text-hv-text-3 mt-0.5">
              {signup.email || "sem email"}
              {signup.phone ? ` · ${signup.phone}` : ""}
            </div>
            {(signup.city || signup.state) && (
              <div className="text-[11px] text-hv-text-3">
                {[signup.city, signup.state].filter(Boolean).join(" / ")}
              </div>
            )}
          </div>

          {/* Status badge */}
          <span
            className="hv-chip text-[10px] font-bold uppercase tracking-wider shrink-0"
            style={{
              background: signup.status === "pending"
                ? "hsl(var(--hv-amber) / 0.18)"
                : signup.status === "approved"
                ? "hsl(var(--hv-leaf) / 0.15)"
                : "hsl(var(--hv-coral) / 0.12)",
              color: signup.status === "pending"
                ? "hsl(var(--hv-amber))"
                : signup.status === "approved"
                ? "hsl(var(--hv-leaf))"
                : "hsl(var(--hv-coral))",
            }}
          >
            {signup.status === "pending" ? "Pendente" : signup.status === "approved" ? "Aprovado" : "Rejeitado"}
          </span>
        </div>

        {/* Details row */}
        <div className="flex flex-wrap gap-2 mt-3">
          {signup.plan_id && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-hv-foam text-hv-navy">
              <HVIcon name="wallet" size={11} />
              Plano ID: {signup.plan_id.slice(0, 8)}…
            </span>
          )}
          {signup.payment_method && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-hv-foam text-hv-navy">
              <HVIcon name="credit" size={11} />
              {signup.payment_method}
            </span>
          )}
          {signup.document && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-hv-foam text-hv-text-2">
              CNPJ/CPF: {signup.document}
            </span>
          )}
        </div>

        {signup.notes && (
          <div className="mt-2 px-3 py-2 rounded-[8px] bg-background text-[12px] text-hv-text-2 italic">
            {signup.notes}
          </div>
        )}

        {/* Actions — only for pending */}
        {signup.status === "pending" && (
          <div className="flex gap-2 mt-3.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setConfirmReject(true)}
              className="flex-1 py-2 rounded-[10px] text-[12px] font-semibold border-0"
              style={{
                background: "hsl(var(--hv-coral) / 0.12)",
                color: "hsl(var(--hv-coral))",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Rejeitar
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setConfirmApprove(true)}
              className="flex-1 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-leaf))",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {approve.isPending ? "Aprovando…" : "Aprovar"}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={() => {
          approve.mutate(signup.id, { onSuccess: () => setConfirmApprove(false) });
        }}
        title="Aprovar pré-cadastro"
        message={`Aprovar o cadastro de "${signup.name || signup.email}"? Isso pode criar o tenant automaticamente.`}
        confirmLabel="Aprovar"
        loading={approve.isPending}
      />

      <ConfirmDialog
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        onConfirm={() => {
          reject.mutate(signup.id, { onSuccess: () => setConfirmReject(false) });
        }}
        title="Rejeitar pré-cadastro"
        message={`Rejeitar o cadastro de "${signup.name || signup.email}"?`}
        confirmLabel="Rejeitar"
        destructive
        loading={reject.isPending}
      />
    </>
  );
}
