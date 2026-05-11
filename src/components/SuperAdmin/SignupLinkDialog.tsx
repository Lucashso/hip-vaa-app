// SignupLinkDialog — dialog para criar/editar links de cadastro de novas filiais.
// INSERT/UPDATE signup_links com plan_id, payment_methods, discount, tracking, expires_at.

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { FieldText, FieldNumber, FieldSelect, FieldToggle } from "@/components/Field";
import { useCreateSignupLink, useUpdateSignupLink, type SignupLink, type CreateSignupLinkPayload } from "@/hooks/useSignupLinks";
import { usePlatformPlans } from "@/hooks/useSuper";
import { HVIcon } from "@/lib/HVIcon";

interface Props {
  open: boolean;
  onClose: () => void;
  tenantId?: string | null;
  editing?: SignupLink | null;
}

const PAYMENT_OPTS = [
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "free", label: "Gratuito" },
];

export function SignupLinkDialog({ open, onClose, tenantId, editing }: Props) {
  const { data: plans = [] } = usePlatformPlans(false);
  const create = useCreateSignupLink();
  const update = useUpdateSignupLink();

  const [planId, setPlanId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["pix", "boleto"]);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [discountCents, setDiscountCents] = useState<number | null>(null);
  const [tracking, setTracking] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [slug, setSlug] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (editing) {
      setPlanId(editing.plan_id || "");
      setPaymentMethods(editing.payment_methods || ["pix", "boleto"]);
      setDiscountPercent(editing.discount_percent ?? null);
      setDiscountCents(editing.discount_cents ?? null);
      setTracking(editing.tracking_code || "");
      setExpiresAt(editing.expires_at ? editing.expires_at.slice(0, 10) : "");
      setMaxUses(editing.max_uses ?? null);
      setNotes(editing.notes || "");
      setSlug(editing.slug || "");
      setActive(editing.active ?? true);
    } else {
      setPlanId("");
      setPaymentMethods(["pix", "boleto"]);
      setDiscountPercent(null);
      setDiscountCents(null);
      setTracking("");
      setExpiresAt("");
      setMaxUses(null);
      setNotes("");
      setSlug("");
      setActive(true);
    }
  }, [editing, open]);

  function togglePaymentMethod(method: string) {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  }

  function handleSubmit() {
    const payload: CreateSignupLinkPayload = {
      tenant_id: tenantId ?? null,
      plan_id: planId || null,
      payment_methods: paymentMethods.length > 0 ? paymentMethods : undefined,
      discount_percent: discountPercent,
      discount_cents: discountCents,
      tracking_code: tracking || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      max_uses: maxUses,
      notes: notes || null,
      slug: slug || null,
      active,
    };

    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  const isLoading = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar link de cadastro" : "Gerar link de cadastro"}
      subtitle="SIGNUP LINKS · SUPER ADMIN"
      maxWidth={520}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-[10px] text-[12px] font-semibold text-hv-text"
            style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
            style={{ background: "hsl(var(--hv-navy))", opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? "Salvando…" : editing ? "Salvar" : "Criar link"}
          </button>
        </>
      }
    >
      <div className="space-y-1">
        {/* Plano */}
        <FieldSelect
          label="Plano da plataforma"
          value={planId as string}
          onChange={(v) => setPlanId(v)}
          options={plans.map((p) => ({ value: p.id, label: `${p.name} · R$ ${(p.price_cents / 100).toFixed(2)}/mês` }))}
          placeholderOption="— Nenhum plano específico —"
        />

        {/* Métodos de pagamento */}
        <div className="mb-2.5">
          <div className="text-[12px] font-semibold text-hv-text mb-1.5">
            Métodos de pagamento aceitos
          </div>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTS.map((opt) => {
              const on = paymentMethods.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePaymentMethod(opt.value)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
                  style={{
                    background: on ? "hsl(var(--hv-navy))" : "hsl(var(--hv-bg))",
                    color: on ? "white" : "hsl(var(--hv-text-2))",
                    border: on ? "none" : "1px solid hsl(var(--hv-line))",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desconto */}
        <div className="grid grid-cols-2 gap-3">
          <FieldNumber
            label="Desconto (%)"
            value={discountPercent}
            onChange={setDiscountPercent}
            min={0}
            max={100}
            step={1}
            placeholder="ex: 10"
          />
          <FieldNumber
            label="Desconto (R$ centavos)"
            value={discountCents}
            onChange={setDiscountCents}
            min={0}
            step={100}
            placeholder="ex: 5000"
          />
        </div>

        {/* Tracking + Slug */}
        <div className="grid grid-cols-2 gap-3">
          <FieldText
            label="Código de rastreio"
            value={tracking}
            onChange={setTracking}
            placeholder="ex: CAMPANHA-MAI25"
          />
          <FieldText
            label="Slug do link"
            value={slug}
            onChange={setSlug}
            placeholder="ex: black-friday"
          />
        </div>

        {/* Expiração + max usos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="mb-2.5">
            <div className="text-[12px] font-semibold text-hv-text mb-1">Expira em</div>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
              style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
            />
          </div>
          <FieldNumber
            label="Máx. usos"
            value={maxUses}
            onChange={setMaxUses}
            min={1}
            step={1}
            placeholder="ilimitado"
          />
        </div>

        {/* Notas */}
        <FieldText
          label="Notas internas"
          value={notes}
          onChange={setNotes}
          placeholder="ex: Link para campanha de parceria"
        />

        {/* Ativo */}
        <FieldToggle
          label="Link ativo"
          description="Links inativos não aceitam novos cadastros"
          checked={active}
          onChange={setActive}
        />

        {/* Preview URL */}
        {slug && (
          <div
            className="flex items-center gap-2 mt-2 px-3 py-2 rounded-[8px]"
            style={{ background: "hsl(var(--hv-foam))", border: "1px dashed hsl(var(--hv-cyan))" }}
          >
            <HVIcon name="copy" size={13} color="hsl(var(--hv-navy))" />
            <span className="hv-mono text-[10px] text-hv-navy">
              hipvaa.app/assinar?link={slug}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
