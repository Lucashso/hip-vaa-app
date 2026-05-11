// Admin · Locais — CRUD venues do tenant.

import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { FieldText, FieldNumber, FieldTextArea } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import {
  useVenues,
  useCreateVenue,
  useUpdateVenue,
  useDeleteVenue,
  useToggleVenueActive,
  type Venue,
  type VenueInput,
} from "@/hooks/useVenues";
import { useAuth } from "@/hooks/useAuth";

const COLORS = ["#1B6FB0", "#25C7E5", "#2FB37A", "#FF6B4A", "#7B2D9F", "#F2B544"];

const EMPTY: VenueInput = {
  name: "",
  address: "",
  geo_lat: null,
  geo_lng: null,
  radius_m: 100,
  default_capacity: 30,
  notes: "",
};

function venueToInput(v: Venue): VenueInput {
  return {
    name: v.name,
    address: v.address ?? "",
    geo_lat: v.geo_lat,
    geo_lng: v.geo_lng,
    radius_m: v.radius_m ?? 100,
    default_capacity: v.default_capacity,
    notes: v.notes ?? "",
  };
}

export default function AdminLocais() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const { data: venues = [], isLoading } = useVenues(tenantId);
  const createMut = useCreateVenue(tenantId);
  const updateMut = useUpdateVenue();
  const deleteMut = useDeleteVenue();
  const toggleMut = useToggleVenueActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState<VenueInput>(EMPTY);
  const [confirmDel, setConfirmDel] = useState<Venue | null>(null);

  const active = venues.filter((v) => v.active).length;

  const onNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const onEdit = (v: Venue) => {
    setEditing(v);
    setForm(venueToInput(v));
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
        title="Locais"
        sub={`${active} ATIVO${active === 1 ? "" : "S"} NA FILIAL`}
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
      <div className="flex-1 overflow-auto pb-24 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : venues.length === 0 ? (
          <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
            Nenhum local cadastrado.
          </div>
        ) : (
          venues.map((l, i) => {
            const c = COLORS[i % COLORS.length];
            return (
              <div
                key={l.id}
                className="hv-card mb-2.5 overflow-hidden p-0"
                style={{ opacity: l.active ? 1 : 0.55 }}
              >
                <div
                  className="h-[64px] relative"
                  style={{ background: `linear-gradient(135deg, ${c}, #061826)` }}
                >
                  <svg
                    viewBox="0 0 360 64"
                    className="absolute inset-0 w-full h-full opacity-70"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 40 Q90 30 180 40 T360 40 L360 64 L0 64Z"
                      fill="rgba(37,199,229,0.6)"
                    />
                  </svg>
                </div>
                <div className="p-3.5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold truncate">{l.name}</div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5">
                        {l.address || "Endereço não informado"}
                      </div>
                      <div
                        className="hv-mono text-[10px] text-hv-text-3 mt-1"
                        style={{ letterSpacing: "0.04em" }}
                      >
                        cap. {l.default_capacity ?? "—"} · raio {l.radius_m ?? 100}m
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMut.mutate({ id: l.id, active: !l.active })}
                      className="w-[42px] h-6 rounded-[12px] p-0.5 border-0 shrink-0"
                      style={{
                        background: l.active ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-[10px] bg-white"
                        style={{
                          transform: l.active ? "translateX(18px)" : "none",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => onEdit(l)}
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
                      onClick={() => setConfirmDel(l)}
                      className="flex-1 py-2 rounded-[8px] text-[11px] font-bold text-white border-0"
                      style={{ background: "hsl(var(--hv-coral))" }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Editar local" : "Novo local"}
        subtitle="VENUE DO TENANT"
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
        <FieldText
          label="Endereço"
          value={form.address ?? ""}
          onChange={(v) => setForm({ ...form, address: v })}
        />
        <div className="grid grid-cols-2 gap-2">
          <FieldNumber
            label="Latitude"
            value={form.geo_lat}
            onChange={(v) => setForm({ ...form, geo_lat: v })}
            step={0.000001}
          />
          <FieldNumber
            label="Longitude"
            value={form.geo_lng}
            onChange={(v) => setForm({ ...form, geo_lng: v })}
            step={0.000001}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldNumber
            label="Raio (m)"
            value={form.radius_m}
            onChange={(v) => setForm({ ...form, radius_m: v })}
          />
          <FieldNumber
            label="Capacidade padrão"
            value={form.default_capacity}
            onChange={(v) => setForm({ ...form, default_capacity: v })}
          />
        </div>
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
        title="Excluir local?"
        message={`O local "${confirmDel?.name}" será removido. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={deleteMut.isPending}
      />
    </div>
  );
}

