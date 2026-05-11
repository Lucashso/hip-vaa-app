// SavedCardsManager — lista de cartões salvos do aluno + botões remover / definir padrão.
// Placeholder pra "Adicionar cartão" (depende de edge save-payment-method + form de cartão real).

import { Button } from "@/components/Button";
import { HVIcon } from "@/lib/HVIcon";
import { ConfirmDialog } from "@/components/Modal";
import { useState } from "react";
import {
  useStudentPaymentMethods,
  useDeleteStudentPaymentMethod,
  useSetDefaultPaymentMethod,
} from "@/hooks/useStudentPayments";

interface Props {
  studentId: string;
  onAddCard?: () => void;
}

function brandColor(brand: string | null): string {
  switch ((brand || "").toLowerCase()) {
    case "visa":
      return "hsl(var(--hv-blue))";
    case "mastercard":
      return "hsl(var(--hv-coral))";
    case "elo":
      return "hsl(var(--hv-amber))";
    case "amex":
      return "hsl(var(--hv-cyan))";
    default:
      return "hsl(var(--hv-navy))";
  }
}

export function SavedCardsManager({ studentId, onAddCard }: Props) {
  const { data: cards = [], isLoading } = useStudentPaymentMethods(studentId);
  const del = useDeleteStudentPaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();
  const [removeId, setRemoveId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="hv-card p-4 text-sm text-hv-text-2 text-center">
          Carregando cartões…
        </div>
      ) : cards.length === 0 ? (
        <div className="hv-card p-5 text-center">
          <HVIcon name="credit" size={26} color="hsl(var(--hv-text-3))" />
          <div className="text-sm text-hv-text-2 mt-2">
            Nenhum cartão salvo
          </div>
          <div className="text-[11px] text-hv-text-3 mt-0.5">
            Cobranças automáticas exigem cartão de crédito cadastrado.
          </div>
        </div>
      ) : (
        cards.map((c) => (
          <div key={c.id} className="hv-card p-3.5 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-[12px] grid place-items-center text-white shrink-0"
              style={{ background: brandColor(c.card_brand) }}
            >
              <HVIcon name="credit" size={20} stroke={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold truncate">
                {(c.card_brand || "Cartão").toUpperCase()} •••• {c.card_last_four}
              </div>
              <div className="text-[11px] text-hv-text-3 truncate">
                {c.card_holder_name || ""}
                {c.card_expiry ? ` · venc. ${c.card_expiry}` : ""}
              </div>
              {c.is_default && (
                <div className="hv-chip bg-hv-foam text-hv-navy mt-1 inline-block">
                  Padrão
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {!c.is_default && (
                <button
                  type="button"
                  onClick={() =>
                    setDefault.mutate({ id: c.id, studentId })
                  }
                  className="text-[11px] font-semibold text-hv-blue hover:underline"
                >
                  Tornar padrão
                </button>
              )}
              <button
                type="button"
                onClick={() => setRemoveId(c.id)}
                className="text-[11px] font-semibold text-hv-coral hover:underline"
              >
                Remover
              </button>
            </div>
          </div>
        ))
      )}

      <Button
        variant="outline"
        onClick={onAddCard}
        className="w-full"
        type="button"
      >
        <HVIcon name="plus" size={14} stroke={2.2} /> Adicionar cartão
      </Button>

      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) {
            del.mutate(removeId);
            setRemoveId(null);
          }
        }}
        title="Remover cartão?"
        message="O cartão será excluído. Você precisará cadastrá-lo novamente para usá-lo em cobranças."
        confirmLabel="Remover"
        destructive
        loading={del.isPending}
      />
    </div>
  );
}
