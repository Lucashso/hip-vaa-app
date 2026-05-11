// Admin · Planos — CRUD de planos do tenant.

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Chips } from "@/components/Chips";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldNumber, FieldSelect, FieldToggle } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useTogglePlanActive,
  PLAN_TYPES,
  type Plan,
  type PlanInput,
  type PlanType,
} from "@/hooks/usePlans";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/utils";

const COLORS = [
  "hsl(var(--hv-navy))",
  "hsl(var(--hv-blue))",
  "hsl(var(--hv-leaf))",
  "hsl(var(--hv-cyan))",
  "hsl(var(--hv-coral))",
  "hsl(var(--hv-amber))",
];

const PAYMENT_FREQ = [
  { value: "months", label: "Mensal" },
  { value: "quarters", label: "Trimestral" },
  { value: "semesters", label: "Semestral" },
  { value: "years", label: "Anual" },
  { value: "single", label: "Único" },
];

type Filter = "all" | "active" | "inactive";

const EMPTY: PlanInput = {
  name: "",
  type: "mensal",
  price_cents: 0,
  signup_fee_cents: 0,
  billing_cycle_days: 30,
  classes_per_week: null,
  payment_frequency: "months",
  visible_on_signup: true,
  display_order: 0,
};

function planToInput(p: Plan): PlanInput {
  return {
    name: p.name,
    type: p.type,
    price_cents: p.price_cents,
    signup_fee_cents: p.signup_fee_cents ?? 0,
    billing_cycle_days: p.billing_cycle_days ?? 30,
    classes_per_week: p.classes_per_week,
    payment_frequency: p.payment_frequency ?? "months",
    visible_on_signup: p.visible_on_signup,
    display_order: p.display_order,
  };
}

function planPeriod(p: Plan): string {
  if (p.type === "avulso") return "avulso";
  const d = p.billing_cycle_days ?? 30;
  if (d <= 31) return "mensal";
  if (d >= 350 && d <= 380) return "anual";
  return `${Math.round(d / 30)} meses`;
}

export default function AdminPlanos() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: planos = [], isLoading } = usePlans(tenantId);
  const createMut = useCreatePlan(tenantId);
  const updateMut = useUpdatePlan();
  const deleteMut = useDeletePlan();
  const toggleMut = useTogglePlanActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanInput>(EMPTY);
  const [priceBRL, setPriceBRL] = useState("0");
  const [signupBRL, setSignupBRL] = useState("0");
  const [confirmDel, setConfirmDel] = useState<Plan | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const total = planos.length;
    const active = planos.filter((p) => p.active).length;
    return { total, active, inactive: total - active };
  }, [planos]);

  const filtered = useMemo(() => {
    if (filter === "active") return planos.filter((p) => p.active);
    if (filter === "inactive") return planos.filter((p) => !p.active);
    return planos;
  }, [planos, filter]);

  const onNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, display_order: planos.length });
    setPriceBRL("0");
    setSignupBRL("0");
    setDialogOpen(true);
  };
  const onEdit = (p: Plan) => {
    setEditing(p);
    const input = planToInput(p);
    setForm(input);
    setPriceBRL((input.price_cents / 100).toFixed(2));
    setSignupBRL((input.signup_fee_cents / 100).toFixed(2));
    setDialogOpen(true);
  };

  const onSubmit = () => {
    const payload: PlanInput = {
      ...form,
      price_cents: Math.round(Number(priceBRL.replace(",", ".")) * 100) || 0,
      signup_fee_cents: Math.round(Number(signupBRL.replace(",", ".")) * 100) || 0,
    };
    if (!payload.name.trim()) return;
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: payload },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Planos"
        sub={`${counts.active} ATIVOS · ${counts.inactive} INATIVO${counts.inactive === 1 ? "" : "S"}`}
        action={
          <button
            type="button"
            onClick={onNew}
            className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
            style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
          >
            <HVIcon name="plus" size={14} stroke={2.6} /> Novo
          </button>
        }
      />
      <Chips
        items={[
          { l: `Todos · ${counts.total}`, on: filter === "all", onClick: () => setFilter("all") },
          { l: `Ativos · ${counts.active}`, on: filter === "active", onClick: () => setFilter("active") },
          { l: `Inativos · ${counts.inactive}`, on: filter === "inactive", onClick: () => setFilter("inactive") },
        ]}
      />
      <div className="flex-1 overflow-auto pb-24 px-4 pt-2">
        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-4">
            Nenhum plano por enquanto.
          </div>
        ) : (
          filtered.map((p, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div
                key={p.id}
                className="hv-card mb-2.5"
                style={{ padding: 14, opacity: p.active ? 1 : 0.55 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-[12px] grid place-items-center text-white shrink-0"
                    style={{ background: color }}
                  >
                    <HVIcon name="wallet" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[14px] font-bold truncate">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleMut.mutate({ id: p.id, active: !p.active })}
                        className="hv-chip border-0"
                        style={
                          p.active
                            ? { background: "rgba(47,179,122,0.18)", color: "hsl(var(--hv-leaf))" }
                            : { background: "hsl(var(--hv-bg))", color: "hsl(var(--hv-text-3))" }
                        }
                      >
                        {p.active ? "ativo" : "inativo"}
                      </button>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-display text-[22px] font-extrabold">
                        {formatBRL(p.price_cents)}
                      </span>
                      <span className="text-[12px] text-hv-text-3">· {planPeriod(p)}</span>
                    </div>
                    <div className="hv-mono text-[10px] text-hv-text-3 mt-1">
                      {p.classes_per_week ? `${p.classes_per_week}x/sem` : "ilimitado"}
                      {p.visible_on_signup ? " · visível no cadastro" : " · oculto"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-semibold text-hv-text"
                    style={{
                      background: "hsl(var(--hv-bg))",
                      border: "1px solid hsl(var(--hv-line))",
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(p)}
                    className="flex-1 py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                    style={{ background: "hsl(var(--hv-coral))" }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar plano" : "Novo plano"}
        subtitle="MENSALIDADE / AVULSO"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-semibold text-hv-text"
              style={{
                background: "hsl(var(--hv-bg))",
                border: "1px solid hsl(var(--hv-line))",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={createMut.isPending || updateMut.isPending || !form.name.trim()}
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity: !form.name.trim() ? 0.5 : 1,
              }}
            >
              {editing ? "Salvar" : "Criar"}
            </button>
          </>
        }
      >
        <FieldText
          label="Nome"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FieldSelect
          label="Tipo"
          required
          value={form.type}
          options={[...PLAN_TYPES]}
          onChange={(v) => v && setForm({ ...form, type: v as PlanType })}
        />
        <div className="grid grid-cols-2 gap-2">
          <FieldText
            label="Preço (R$)"
            value={priceBRL}
            onChange={setPriceBRL}
            placeholder="0.00"
          />
          <FieldText
            label="Taxa adesão (R$)"
            value={signupBRL}
            onChange={setSignupBRL}
            placeholder="0.00"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldNumber
            label="Ciclo (dias)"
            value={form.billing_cycle_days}
            onChange={(v) => setForm({ ...form, billing_cycle_days: v ?? 30 })}
            min={1}
          />
          <FieldNumber
            label="Aulas/sem"
            value={form.classes_per_week}
            onChange={(v) => setForm({ ...form, classes_per_week: v })}
            placeholder="ilimitado"
            min={1}
            max={14}
          />
        </div>
        <FieldSelect
          label="Frequência de pagamento"
          value={form.payment_frequency as PaymentFrequencyValue}
          options={[...PAYMENT_FREQ] as { value: PaymentFrequencyValue; label: string }[]}
          onChange={(v) => v && setForm({ ...form, payment_frequency: v })}
        />
        <FieldToggle
          label="Visível no cadastro público"
          description="Mostrar este plano na página de signup"
          checked={form.visible_on_signup}
          onChange={(v) => setForm({ ...form, visible_on_signup: v })}
        />
        <FieldNumber
          label="Ordem de exibição"
          value={form.display_order}
          onChange={(v) => setForm({ ...form, display_order: v ?? 0 })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir plano?"
        message={`O plano "${confirmDel?.name}" será removido. Verifique se não há alunos vinculados.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}

type PaymentFrequencyValue = "months" | "quarters" | "semesters" | "years" | "single";
