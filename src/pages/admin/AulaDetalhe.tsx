// Admin · AulaDetalhe — alunos matriculados, cancelamentos e link pra chamada.

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { ConfirmDialog } from "@/components/Modal";
import { FieldText } from "@/components/Field";
import { cn, getInitial } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useClassEnrollments } from "@/hooks/useChamada";
import {
  useClass,
  useClassCancellations,
  useCreateCancellation,
  useDeleteCancellation,
  WEEKDAYS_LABELS,
  CLASS_LEVELS,
} from "@/hooks/useClasses";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type TabKey = "alunos" | "cancelamentos" | "chamada";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "alunos", label: "Alunos" },
  { key: "cancelamentos", label: "Cancelamentos" },
  { key: "chamada", label: "Chamada" },
];

function useRemoveEnrollment(classId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chamada-enrollments", classId] });
      toast.success("Matrícula removida");
    },
    onError: (err: Error) => toast.error("Erro: " + err.message),
  });
}

function formatDateBR(d: string): string {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return d;
  }
}

export default function AdminAulaDetalhe() {
  const navigate = useNavigate();
  const { id: classId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;

  const [tab, setTab] = useState<TabKey>("alunos");
  const { data: classRow, isLoading: loadingClass } = useClass(classId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useClassEnrollments(classId);
  const { data: cancellations = [], isLoading: loadingCancel } = useClassCancellations(
    classId,
  );

  const createCancel = useCreateCancellation(tenantId);
  const deleteCancel = useDeleteCancellation();
  const removeEnrollment = useRemoveEnrollment(classId);

  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [confirmDelCancel, setConfirmDelCancel] = useState<string | null>(null);
  const [newCancelDate, setNewCancelDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newCancelReason, setNewCancelReason] = useState("");

  if (loadingClass) return <Loader />;
  if (!classRow)
    return (
      <div className="p-6 text-center text-sm text-hv-text-3">Turma não encontrada.</div>
    );

  const wdLabel = WEEKDAYS_LABELS[classRow.weekday]?.full ?? "—";
  const levelLabel = classRow.level
    ? CLASS_LEVELS.find((l) => l.value === classRow.level)?.label
    : null;

  const onAddCancellation = () => {
    if (!classId || !newCancelDate) return;
    createCancel.mutate(
      { class_id: classId, date: newCancelDate, reason: newCancelReason || null },
      {
        onSuccess: () => {
          setNewCancelReason("");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div
        style={{
          padding: "16px 16px 18px",
          background: "linear-gradient(140deg, #061826, #1B6FB0)",
          color: "white",
        }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-[10px] grid place-items-center text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <HVIcon name="chevron-left" size={18} />
            </button>
            <div className="hv-mono flex-1 text-[10px] opacity-70 tracking-[0.14em]">
              DETALHE DA TURMA
            </div>
          </div>
          <div className="mt-3.5">
            <div className="hv-mono text-[10px] opacity-75 tracking-[0.16em]">
              {wdLabel.toUpperCase()} · {classRow.start_time.slice(0, 5)} → {classRow.end_time.slice(0, 5)}
            </div>
            <h1 className="font-display text-[24px] mt-1 text-white">{classRow.name}</h1>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {classRow.venue?.name && (
                <span
                  className="hv-chip"
                  style={{
                    background: "rgba(37,199,229,0.22)",
                    color: "hsl(var(--hv-cyan))",
                  }}
                >
                  {classRow.venue.name}
                </span>
              )}
              {classRow.boat?.name && (
                <span
                  className="hv-chip"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                  }}
                >
                  {classRow.boat.name} · {classRow.boat.type}
                </span>
              )}
              {classRow.max_capacity && (
                <span
                  className="hv-chip"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                  }}
                >
                  cap. {classRow.max_capacity}
                </span>
              )}
              {levelLabel && (
                <span
                  className="hv-chip"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    color: "white",
                  }}
                >
                  {levelLabel}
                </span>
              )}
              {!classRow.active && (
                <span
                  className="hv-chip"
                  style={{
                    background: "rgba(255,107,74,0.22)",
                    color: "hsl(var(--hv-coral))",
                  }}
                >
                  inativa
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-hv-surface border-b border-hv-line">
        <div className="max-w-md mx-auto flex gap-4 px-4 pt-3 pb-1.5 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "py-1.5 bg-transparent border-none text-[13px] whitespace-nowrap",
                  active ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
                )}
                style={{
                  borderBottom: active ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3.5 pb-6 space-y-3">
        {tab === "alunos" && (
          <>
            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
              {enrollments.length} matriculado{enrollments.length === 1 ? "" : "s"}
            </h3>

            {loadingEnrollments ? (
              <Loader />
            ) : enrollments.length === 0 ? (
              <div className="hv-card p-6 text-center text-sm text-hv-text-3">
                Nenhum aluno matriculado.
              </div>
            ) : (
              <div className="hv-card overflow-hidden">
                {enrollments.map((e, i, arr) => {
                  const name = e.student?.profile?.full_name ?? "Aluno";
                  return (
                    <div
                      key={e.id}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5",
                        i < arr.length - 1 && "border-b border-hv-line",
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-full grid place-items-center font-display font-extrabold text-white"
                        style={{ background: "hsl(var(--hv-navy))" }}
                      >
                        {getInitial(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{name}</div>
                        <div className="text-[11px] text-hv-text-3 mt-0.5">
                          {e.student?.status ?? "—"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          e.student
                            ? setConfirmRemove({ id: e.id, name })
                            : null
                        }
                        className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
                        style={{
                          background: "rgba(255,107,74,0.15)",
                          color: "hsl(var(--hv-coral))",
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "cancelamentos" && (
          <>
            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em]">
              Adicionar cancelamento
            </h3>
            <div className="hv-card" style={{ padding: 14 }}>
              <label className="block mb-2.5">
                <div className="text-[12px] font-semibold text-hv-text mb-1">Data *</div>
                <input
                  type="date"
                  value={newCancelDate}
                  onChange={(e) => setNewCancelDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
                  style={{
                    background: "hsl(var(--hv-bg))",
                    border: "1px solid hsl(var(--hv-line))",
                  }}
                />
              </label>
              <FieldText
                label="Motivo"
                value={newCancelReason}
                onChange={setNewCancelReason}
                placeholder="Opcional"
              />
              <button
                type="button"
                onClick={onAddCancellation}
                disabled={createCancel.isPending || !newCancelDate}
                className="w-full mt-1 px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
                style={{
                  background: "hsl(var(--hv-coral))",
                  opacity: !newCancelDate ? 0.5 : 1,
                }}
              >
                {createCancel.isPending ? "Aguarde..." : "Adicionar cancelamento"}
              </button>
            </div>

            <h3 className="hv-eyebrow !text-hv-text-2 !text-[12px] !tracking-[0.14em] mt-2">
              Cancelamentos registrados
            </h3>
            {loadingCancel ? (
              <Loader />
            ) : cancellations.length === 0 ? (
              <div className="hv-card p-6 text-center text-sm text-hv-text-3">
                Nenhum cancelamento.
              </div>
            ) : (
              <div className="hv-card overflow-hidden">
                {cancellations.map((c, i, arr) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5",
                      i < arr.length - 1 && "border-b border-hv-line",
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: "hsl(var(--hv-coral))" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold">
                        {formatDateBR(c.cancelled_date)}
                      </div>
                      {c.reason && (
                        <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                          {c.reason}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelCancel(c.id)}
                      className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold"
                      style={{
                        background: "hsl(var(--hv-bg))",
                        color: "hsl(var(--hv-text-2))",
                        border: "1px solid hsl(var(--hv-line))",
                      }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "chamada" && (
          <div className="hv-card p-6 text-center">
            <div className="text-[14px] font-semibold">Chamada do dia</div>
            <div className="text-[11px] text-hv-text-3 mt-1">
              Marque presença dos alunos matriculados.
            </div>
            <button
              type="button"
              onClick={() => classId && navigate(`/admin/chamada/${classId}`)}
              className="mt-3 px-4 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{ background: "hsl(var(--hv-navy))" }}
            >
              Abrir chamada
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove)
            removeEnrollment.mutate(confirmRemove.id, {
              onSuccess: () => setConfirmRemove(null),
            });
        }}
        title="Remover matrícula?"
        message={`O aluno "${confirmRemove?.name}" deixará de estar matriculado nesta turma.`}
        destructive
        confirmLabel="Remover"
        loading={removeEnrollment.isPending}
      />

      <ConfirmDialog
        open={!!confirmDelCancel}
        onClose={() => setConfirmDelCancel(null)}
        onConfirm={() => {
          if (confirmDelCancel)
            deleteCancel.mutate(confirmDelCancel, {
              onSuccess: () => setConfirmDelCancel(null),
            });
        }}
        title="Remover cancelamento?"
        message="A aula voltará a ser exibida nesse dia."
        confirmLabel="Remover"
        loading={deleteCancel.isPending}
      />
    </div>
  );
}
