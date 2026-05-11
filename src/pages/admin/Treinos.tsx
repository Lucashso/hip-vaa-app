// Admin · Treinos — sessões agendadas + templates (/admin/treinos).

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useAlunos } from "@/hooks/useAlunos";
import {
  useTrainingSessionsByTenant,
  useCreateTrainingSession,
} from "@/hooks/useTraining";
import { useWorkoutTemplates } from "@/hooks/useWorkoutLibrary";

// ─── types ─────────────────────────────────────────────────

type Tab = "sessoes" | "templates";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "scheduled", label: "Agendadas" },
  { value: "completed", label: "Concluídas" },
  { value: "skipped", label: "Puladas" },
];

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  completed: "Concluído",
  skipped: "Pulado",
  in_progress: "Em andamento",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "hsl(var(--hv-amber))",
  completed: "hsl(var(--hv-leaf))",
  skipped: "hsl(var(--hv-coral))",
  in_progress: "hsl(var(--hv-blue))",
};

// ─── helpers ───────────────────────────────────────────────

function formatDate(d: string): string {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return d;
  }
}

const inputStyle = {
  width: "100%",
  marginTop: 4,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid hsl(var(--hv-line))",
  background: "white",
  fontSize: 13,
  outline: "none",
} as const;

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: "hsl(var(--hv-text-2))",
  letterSpacing: 1.1,
} as const;

function Backdrop({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 24, 38, 0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 60,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── component ─────────────────────────────────────────────

export default function AdminTreinos() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;

  const [tab, setTab] = useState<Tab>("sessoes");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchAluno, setSearchAluno] = useState("");

  const { data: sessions = [], isLoading: loadingSessions } = useTrainingSessionsByTenant(
    tenantId,
    { status: statusFilter || null },
  );
  const { data: templates = [] } = useWorkoutTemplates(tenantId);
  const { data: alunos = [] } = useAlunos(tenantId, { status: "active" });
  const createSession = useCreateTrainingSession();

  // Nova sessão dialog
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    template_id: "",
    session_date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
  });
  const [alunoSearch, setAlunoSearch] = useState("");

  const filteredAlunos = useMemo(() => {
    const term = alunoSearch.toLowerCase().trim();
    if (!term) return alunos.slice(0, 10);
    return alunos
      .filter((a) => {
        const name = (a.profile?.full_name ?? "").toLowerCase();
        const nick = (a.profile?.nickname ?? "").toLowerCase();
        return name.includes(term) || nick.includes(term);
      })
      .slice(0, 8);
  }, [alunos, alunoSearch]);

  // Client-side filter by aluno name
  const filteredSessions = useMemo(() => {
    const term = searchAluno.toLowerCase().trim();
    if (!term) return sessions;
    return sessions.filter((s) => {
      const name = (s.student_name ?? "").toLowerCase();
      const nick = (s.student_nickname ?? "").toLowerCase();
      return name.includes(term) || nick.includes(term);
    });
  }, [sessions, searchAluno]);

  const openDialog = () => {
    setForm({
      student_id: "",
      template_id: "",
      session_date: new Date().toISOString().split("T")[0],
      title: "",
      description: "",
    });
    setAlunoSearch("");
    setShowDialog(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !form.student_id || !form.session_date) {
      toast.error("Aluno e data são obrigatórios");
      return;
    }
    await createSession.mutateAsync({
      tenant_id: tenantId,
      student_id: form.student_id,
      session_date: form.session_date,
      title: form.title.trim() || null,
      description: form.description.trim() || null,
      template_id: form.template_id || null,
    });
    setShowDialog(false);
  };

  const selectedAluno = alunos.find((a) => a.id === form.student_id);
  const selectedTemplate = templates.find((t) => t.id === form.template_id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Treinos"
        sub="ADMIN · PLANOS DE TREINO"
        back={false}
        action={
          tab === "sessoes" ? (
            <button
              type="button"
              onClick={openDialog}
              className="px-3 py-2 rounded-[10px] text-[12px] font-bold flex gap-1.5 items-center border-0"
              style={{ background: "hsl(var(--hv-cyan))", color: "hsl(var(--hv-ink))" }}
            >
              <HVIcon name="plus" size={14} stroke={2.6} />
              Nova sessão
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "8px 16px",
          background: "hsl(var(--hv-surface))",
          borderBottom: "1px solid hsl(var(--hv-line))",
        }}
      >
        {(["sessoes", "templates"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              background: tab === t ? "hsl(var(--hv-navy))" : "transparent",
              color: tab === t ? "white" : "hsl(var(--hv-text-2))",
              cursor: "pointer",
            }}
          >
            {t === "sessoes" ? "Sessões agendadas" : "Templates"}
          </button>
        ))}
      </div>

      {/* ── TAB: SESSOES ── */}
      {tab === "sessoes" && (
        <div className="flex-1 overflow-auto pb-24">
          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 16px",
              background: "hsl(var(--hv-surface))",
              borderBottom: "1px solid hsl(var(--hv-line))",
              flexWrap: "wrap",
            }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 20,
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 11,
                  fontWeight: 700,
                  background: statusFilter === opt.value ? "hsl(var(--hv-navy))" : "transparent",
                  color: statusFilter === opt.value ? "white" : "hsl(var(--hv-text-2))",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search aluno */}
          <div style={{ padding: "10px 16px 4px" }}>
            <input
              value={searchAluno}
              onChange={(e) => setSearchAluno(e.target.value)}
              placeholder="Buscar aluno..."
              style={{
                ...inputStyle,
                marginTop: 0,
                background: "hsl(var(--hv-bg))",
                paddingLeft: 36,
                backgroundImage: "none",
                position: "relative",
              }}
            />
          </div>

          <div className="px-4 pt-2">
            {loadingSessions ? (
              <Loader />
            ) : filteredSessions.length === 0 ? (
              <div className="hv-card p-6 text-center text-sm text-hv-text-2 mt-2">
                Nenhuma sessão encontrada.
              </div>
            ) : (
              <div className="hv-card overflow-hidden p-0">
                {filteredSessions.map((s, i, arr) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3"
                    style={{
                      padding: "12px 14px",
                      borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[10px] grid place-items-center text-white shrink-0"
                      style={{ background: STATUS_COLORS[s.status ?? "scheduled"] ?? "hsl(var(--hv-navy))" }}
                    >
                      <HVIcon name="dumbbell" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">
                        {s.title || "Sessão de treino"}
                      </div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                        {s.student_name ?? "Aluno desconhecido"} · {formatDate(s.session_date)}
                      </div>
                    </div>
                    <span
                      className="hv-chip shrink-0"
                      style={{
                        background: `${STATUS_COLORS[s.status ?? "scheduled"]}22`,
                        color: STATUS_COLORS[s.status ?? "scheduled"] ?? "hsl(var(--hv-text-2))",
                        fontSize: 10,
                      }}
                    >
                      {STATUS_LABELS[s.status ?? "scheduled"] ?? s.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/treino/${s.id}`)}
                      className="w-7 h-7 rounded-[8px] grid place-items-center border-0 shrink-0"
                      style={{ background: "hsl(var(--hv-foam))", color: "hsl(var(--hv-navy))" }}
                      title="Detalhes"
                    >
                      <HVIcon name="chevron-right" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TEMPLATES ── */}
      {tab === "templates" && (
        <div className="flex-1 overflow-auto pb-24 px-4 pt-4">
          <div className="hv-card p-4 text-center mb-4">
            <div className="font-display text-[15px] font-bold text-hv-text-1 mb-1">
              Biblioteca de treinos
            </div>
            <div className="text-[12px] text-hv-text-3 mb-3">
              Gerencie seus templates de treino e exercícios na biblioteca completa.
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/biblioteca-treinos")}
              className="px-4 py-2.5 rounded-[10px] text-[13px] font-bold border-0 inline-flex items-center gap-2"
              style={{ background: "hsl(var(--hv-navy))", color: "white" }}
            >
              <HVIcon name="dumbbell" size={14} />
              Abrir Biblioteca de treinos
            </button>
          </div>

          {templates.length > 0 && (
            <div className="hv-card overflow-hidden p-0">
              {templates.map((t, i, arr) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: "12px 14px",
                    borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--hv-line))" : "none",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-[10px] grid place-items-center text-white shrink-0"
                    style={{ background: "hsl(var(--hv-navy))" }}
                  >
                    <HVIcon name="trophy" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{t.name}</div>
                    <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                      {t.exercise_count} exercício{t.exercise_count === 1 ? "" : "s"}
                      {t.description ? ` · ${t.description}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialog nova sessão */}
      {showDialog && (
        <Backdrop onClick={() => !createSession.isPending && setShowDialog(false)}>
          <form onSubmit={handleCreate} className="hv-card" style={{ padding: 22 }}>
            <div
              className="hv-mono"
              style={{ fontSize: 10, color: "hsl(var(--hv-text-3))", letterSpacing: 1.2, fontWeight: 700 }}
            >
              NOVA SESSÃO
            </div>
            <h3
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20,
                marginTop: 4,
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              Criar sessão de treino
            </h3>

            {/* Aluno search */}
            <div style={{ marginBottom: 12 }}>
              <label className="hv-mono" style={labelStyle}>
                Aluno *
              </label>
              {selectedAluno ? (
                <div
                  style={{
                    ...inputStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "default",
                  }}
                >
                  <span>{selectedAluno.profile?.full_name ?? "—"}</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, student_id: "" }))}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "hsl(var(--hv-coral))",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={alunoSearch}
                    onChange={(e) => setAlunoSearch(e.target.value)}
                    placeholder="Pesquisar aluno..."
                    style={inputStyle}
                  />
                  {alunoSearch.length > 0 && filteredAlunos.length > 0 && (
                    <div
                      style={{
                        border: "1px solid hsl(var(--hv-line))",
                        borderTop: "none",
                        borderRadius: "0 0 10px 10px",
                        background: "white",
                        maxHeight: 160,
                        overflowY: "auto",
                      }}
                    >
                      {filteredAlunos.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, student_id: a.id }));
                            setAlunoSearch("");
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            fontSize: 13,
                            cursor: "pointer",
                            borderBottom: "1px solid hsl(var(--hv-line))",
                          }}
                        >
                          {a.profile?.full_name ?? "—"}
                          {a.profile?.nickname ? ` (${a.profile.nickname})` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Data */}
            <div style={{ marginBottom: 12 }}>
              <label className="hv-mono" style={labelStyle}>
                Data *
              </label>
              <input
                type="date"
                value={form.session_date}
                onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>

            {/* Template */}
            <div style={{ marginBottom: 12 }}>
              <label className="hv-mono" style={labelStyle}>
                Template (opcional)
              </label>
              <select
                value={form.template_id}
                onChange={(e) => {
                  const tmpl = templates.find((t) => t.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    template_id: e.target.value,
                    title: tmpl?.name ?? f.title,
                  }));
                }}
                style={inputStyle}
              >
                <option value="">Sem template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.exercise_count} ex.)
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div style={{ fontSize: 11, color: "hsl(var(--hv-text-3))", marginTop: 4 }}>
                  {selectedTemplate.exercise_count} exercício{selectedTemplate.exercise_count === 1 ? "" : "s"} serão copiados
                </div>
              )}
            </div>

            {/* Título */}
            <div style={{ marginBottom: 12 }}>
              <label className="hv-mono" style={labelStyle}>
                Título (opcional)
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Treino de força A"
                style={inputStyle}
              />
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: 18 }}>
              <label className="hv-mono" style={labelStyle}>
                Descrição (opcional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={createSession.isPending}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createSession.isPending || !form.student_id || !form.session_date}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-navy))",
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  opacity: !form.student_id || !form.session_date ? 0.5 : 1,
                }}
              >
                {createSession.isPending && <Loader2 size={14} className="animate-spin" />}
                Criar sessão
              </button>
            </div>
          </form>
        </Backdrop>
      )}
    </div>
  );
}
