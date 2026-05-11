// Admin · Canoas — CRUD embarcações do tenant.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldNumber, FieldSelect, FieldTextArea } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import {
  useBoats,
  useCreateBoat,
  useUpdateBoat,
  useDeleteBoat,
  useToggleBoatStatus,
  BOAT_TYPES,
  type Boat,
  type BoatInput,
  type BoatType,
} from "@/hooks/useBoats";
import { useVenues } from "@/hooks/useVenues";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["#1B6FB0", "#2FB37A", "#F2B544", "#FF6B4A", "#7B2D9F", "#25C7E5"];

const EMPTY: BoatInput = {
  name: "",
  type: "OC6",
  capacity: 6,
  venue_id: null,
  photo_url: "",
  notes: "",
};

function boatToInput(b: Boat): BoatInput {
  return {
    name: b.name,
    type: b.type,
    capacity: b.capacity,
    venue_id: b.venue_id,
    photo_url: b.photo_url ?? "",
    notes: "",
  };
}

export default function AdminCanoas() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: boats = [], isLoading } = useBoats(tenantId);
  const { data: venues = [] } = useVenues(tenantId);
  const createMut = useCreateBoat(tenantId);
  const updateMut = useUpdateBoat();
  const deleteMut = useDeleteBoat();
  const toggleMut = useToggleBoatStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Boat | null>(null);
  const [form, setForm] = useState<BoatInput>(EMPTY);
  const [confirmDel, setConfirmDel] = useState<Boat | null>(null);

  const inMaint = boats.filter((b) => b.status === "maintenance").length;

  const onNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const onEdit = (b: Boat) => {
    setEditing(b);
    setForm(boatToInput(b));
    setDialogOpen(true);
  };
  const onSubmit = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input: form },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMut.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Embarcações"
        sub={`${boats.length} NA FROTA · ${inMaint} MANUTENÇÃO`}
        action={
          <button
            type="button"
            onClick={onNew}
            className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
            style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
          >
            <HVIcon name="plus" size={14} stroke={2.6} /> Nova
          </button>
        }
      />
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : boats.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhuma embarcação cadastrada.
          </div>
        ) : (
          boats.map((c, i) => {
            const color = COLORS[i % COLORS.length];
            const isActive = c.status === "active";
            const cap = c.capacity || 1;
            return (
              <div key={c.id} className="hv-card mb-2.5" style={{ padding: 14 }}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold truncate">{c.name}</div>
                    <div
                      className="hv-mono text-[11px] text-hv-text-3 mt-0.5"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {c.type} · {cap} {cap === 1 ? "lugar" : "lugares"}
                      {c.venue?.name ? ` · ${c.venue.name}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleMut.mutate({
                        id: c.id,
                        status: isActive ? "maintenance" : "active",
                      })
                    }
                    className="hv-chip border-0"
                    style={
                      isActive
                        ? { background: "rgba(47,179,122,0.18)", color: "hsl(var(--hv-leaf))" }
                        : { background: "rgba(242,181,68,0.2)", color: "hsl(var(--hv-amber))" }
                    }
                  >
                    {isActive ? "ativa" : "manutenção"}
                  </button>
                </div>
                <svg viewBox="0 0 320 50" className="w-full">
                  <path
                    d="M20 25 Q40 8 160 8 Q280 8 300 25 Q280 42 160 42 Q40 42 20 25Z"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                  />
                  {Array.from({ length: cap }).map((_, j) => (
                    <circle
                      key={`c-${j}`}
                      cx={50 + j * (220 / Math.max(cap, 1))}
                      cy="25"
                      r="7"
                      fill={color}
                      opacity="0.85"
                    />
                  ))}
                </svg>
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
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
                    onClick={() => setConfirmDel(c)}
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
        title={editing ? "Editar embarcação" : "Nova embarcação"}
        subtitle="FROTA DO TENANT"
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
          options={BOAT_TYPES.map((b) => ({ value: b.value, label: b.label }))}
          onChange={(v) => {
            if (!v) return;
            const def = BOAT_TYPES.find((b) => b.value === v);
            setForm({ ...form, type: v as BoatType, capacity: def?.capacity ?? form.capacity });
          }}
        />
        <FieldNumber
          label="Capacidade"
          value={form.capacity}
          onChange={(v) => setForm({ ...form, capacity: v ?? 1 })}
          min={1}
          max={12}
        />
        <FieldSelect
          label="Local (venue)"
          value={form.venue_id ?? ""}
          options={venues.map((v) => ({ value: v.id, label: v.name }))}
          onChange={(v) => setForm({ ...form, venue_id: v || null })}
          placeholderOption="— sem local —"
        />
        <FieldText
          label="URL da foto"
          value={form.photo_url ?? ""}
          onChange={(v) => setForm({ ...form, photo_url: v })}
          placeholder="https://..."
        />
        <FieldTextArea
          label="Notas"
          value={form.notes ?? ""}
          onChange={(v) => setForm({ ...form, notes: v })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel)
            deleteMut.mutate(confirmDel.id, { onSuccess: () => setConfirmDel(null) });
        }}
        title="Excluir embarcação?"
        message={`A canoa "${confirmDel?.name}" será removida.`}
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
      />
    </div>
  );
}
