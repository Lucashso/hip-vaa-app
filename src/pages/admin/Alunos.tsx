// Admin · Alunos — visão consolidada (Mensalistas / Avulsos / Parceiros).
// Substitui o antigo equipe/AlunosLista.tsx na rota /admin/alunos.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { FieldText, FieldSelect, FieldTextArea } from "@/components/Field";
import { HVIcon } from "@/lib/HVIcon";
import { useAuth } from "@/hooks/useAuth";
import { useAlunos, useCreateStudent, type CreateStudentInput } from "@/hooks/useAlunos";
import { useDropInStudents } from "@/hooks/useDropInStudents";
import { usePartnerStudents } from "@/hooks/usePartnerStudents";
import { usePlans } from "@/hooks/usePlans";
import { cn, formatBRL, getInitial } from "@/lib/utils";

const COLORS = ["#1B6FB0", "#FF6B4A", "#2FB37A", "#F2B544", "#7B2D9F", "#25C7E5"];

type Tab = "mensalistas" | "avulsos" | "parceiros";
type FilterKey = "all" | "active" | "pending" | "delinquent";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Em dia" },
  { key: "pending", label: "Pendentes" },
  { key: "delinquent", label: "Vencidos" },
];

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "mensalistas", label: "Mensalistas" },
  { key: "avulsos", label: "Avulsos" },
  { key: "parceiros", label: "Parceiros" },
];

const PROVIDER_LABEL: Record<string, string> = {
  wellhub: "Wellhub",
  totalpass: "TotalPass",
  decathlon: "Decathlon",
};

function statusLabel(s: string): string {
  if (s === "active") return "em dia";
  if (s === "pending") return "pendente";
  if (s === "delinquent") return "vencido";
  if (s === "inactive") return "inativo";
  return s;
}

function formatPhoneBR(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCpfBR(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

interface NewStudentForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  birthdate: string;
  address: string;
  plan_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  medical_notes: string;
}

const EMPTY_FORM: NewStudentForm = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  cpf: "",
  birthdate: "",
  address: "",
  plan_id: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  blood_type: "unknown",
  medical_notes: "",
};

export default function AdminAlunos() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;

  const [tab, setTab] = useState<Tab>("mensalistas");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewStudentForm>(EMPTY_FORM);

  const { data: alunos, isLoading: loadingAlunos } = useAlunos(tenantId, {
    status: filter,
    search,
  });
  const { data: dropIns, isLoading: loadingDropIns } = useDropInStudents(tenantId, {
    filter: "pending",
    search,
  });
  const { data: partners, isLoading: loadingPartners } = usePartnerStudents(tenantId, {
    search,
  });
  const { data: plans = [] } = usePlans(tenantId);
  const createMut = useCreateStudent();

  const counts = useMemo(() => {
    if (!alunos) return { all: 0, active: 0, pending: 0, delinquent: 0 };
    const c = { all: alunos.length, active: 0, pending: 0, delinquent: 0 };
    alunos.forEach((a) => {
      if (a.status === "active") c.active += 1;
      else if (a.status === "pending") c.pending += 1;
      else if (a.status === "delinquent") c.delinquent += 1;
    });
    return c;
  }, [alunos]);

  const ativos = counts.active;
  const emTeste = dropIns?.length ?? 0;

  const partnersByProvider = useMemo(() => {
    const grouped = new Map<string, typeof partners>();
    (partners ?? []).forEach((p) => {
      const key = p.provider || "outros";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    });
    return Array.from(grouped.entries());
  }, [partners]);

  const onNew = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const onSubmit = () => {
    if (!tenantId) return;
    if (!form.full_name.trim() || !form.email.trim() || !form.password || form.password.length < 6) return;
    const input: CreateStudentInput = {
      tenant_id: tenantId,
      email: form.email.trim(),
      password: form.password,
      full_name: form.full_name.trim(),
      cpf: form.cpf,
      birthdate: form.birthdate,
      phone: form.phone,
      address: form.address || "—",
      emergency_contact_name: form.emergency_contact_name || form.full_name.trim(),
      emergency_contact_phone: form.emergency_contact_phone || form.phone,
      blood_type: form.blood_type || "unknown",
      can_swim: true,
      medical_notes: form.medical_notes || null,
      consent_signed: false,
      plan_id: form.plan_id || null,
    };
    createMut.mutate(input, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm(EMPTY_FORM);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader
        title="Alunos"
        sub={`${ativos} ATIVOS · ${emTeste} EM TESTE`}
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

      {/* Tabs */}
      <div className="flex gap-4 px-4 pt-2.5 pb-1.5 bg-hv-surface border-b border-hv-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "py-1.5 text-[13px] bg-transparent border-0",
              tab === t.key ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
            )}
            style={{
              borderBottom:
                tab === t.key ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="px-4 pt-3">
        <div
          className="flex items-center gap-2 px-3.5 rounded-[12px] bg-hv-surface border border-hv-line"
          style={{ height: 44 }}
        >
          <HVIcon name="search" size={16} color="hsl(var(--hv-text-3))" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, email, CPF…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-hv-text placeholder:text-hv-text-3"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-24 px-4 pt-3 space-y-3">
        {/* Conteúdo da tab */}
        {tab === "mensalistas" && (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                const count =
                  f.key === "all"
                    ? counts.all
                    : f.key === "active"
                      ? counts.active
                      : f.key === "pending"
                        ? counts.pending
                        : counts.delinquent;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "shrink-0 hv-chip cursor-pointer",
                      isActive
                        ? "!bg-hv-navy !text-white"
                        : "!bg-hv-surface !text-hv-text-2 border border-hv-line",
                    )}
                  >
                    {f.label} · {count}
                  </button>
                );
              })}
            </div>

            <div className="hv-card overflow-hidden">
              {loadingAlunos ? (
                <div className="px-3.5 py-6 text-center text-hv-text-3 text-sm">
                  Carregando alunos…
                </div>
              ) : !alunos || alunos.length === 0 ? (
                <div className="px-3.5 py-8 text-center">
                  <div className="text-[13px] font-semibold text-hv-text">Sem alunos por aqui</div>
                  <div className="text-[11px] text-hv-text-3 mt-1">
                    {search ? "Nenhum resultado para a busca." : "Adicione o primeiro aluno da filial."}
                  </div>
                </div>
              ) : (
                alunos.map((a, i, arr) => {
                  const name = a.profile?.full_name || "Sem nome";
                  const inv = a.latest_invoice;
                  const today = new Date().toISOString().split("T")[0];
                  let invStatus = statusLabel(a.status);
                  let invColor = "hsl(var(--hv-leaf))";
                  if (a.status === "delinquent") invColor = "hsl(var(--hv-coral))";
                  else if (a.status === "pending") invColor = "hsl(var(--hv-amber))";
                  else if (a.status === "inactive") invColor = "hsl(var(--hv-text-3))";
                  if (inv && inv.status === "pending" && inv.due_date < today) {
                    const days = Math.floor(
                      (Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24),
                    );
                    invStatus = `vencido ${days}d`;
                    invColor = "hsl(var(--hv-coral))";
                  }
                  const planName = a.plan?.name || "Sem plano";
                  const matricula = `#${a.id.slice(0, 6).toUpperCase()}`;
                  const color = COLORS[i % COLORS.length];
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => navigate(`/admin/alunos/${a.id}`)}
                      className={cn(
                        "w-full text-left flex items-center gap-3 px-3.5 py-3 hover:bg-hv-foam/30",
                        i < arr.length - 1 && "border-b border-hv-line",
                      )}
                    >
                      <div
                        className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-display font-bold shrink-0"
                        style={{ background: color }}
                      >
                        {getInitial(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[13px] font-bold truncate">{name}</span>
                          <span className="hv-mono text-[10px] text-hv-text-3 tracking-[0.04em]">
                            {matricula}
                          </span>
                        </div>
                        <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                          {planName} · {statusLabel(a.status)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-bold" style={{ color: invColor }}>
                          {invStatus}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        {tab === "avulsos" && (
          <div className="hv-card overflow-hidden">
            {loadingDropIns ? (
              <div className="px-3.5 py-6 text-center text-hv-text-3 text-sm">
                Carregando avulsos…
              </div>
            ) : !dropIns || dropIns.length === 0 ? (
              <div className="px-3.5 py-8 text-center">
                <div className="text-[13px] font-semibold text-hv-text">Nenhum avulso</div>
                <div className="text-[11px] text-hv-text-3 mt-1">
                  Compartilhe o link avulso pra começar a receber inscrições.
                </div>
              </div>
            ) : (
              dropIns.map((d, i, arr) => {
                const color = COLORS[i % COLORS.length];
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => navigate(`/admin/avulso/${d.id}`)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 px-3.5 py-3 hover:bg-hv-foam/30",
                      i < arr.length - 1 && "border-b border-hv-line",
                    )}
                  >
                    <div
                      className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-display font-bold shrink-0"
                      style={{ background: color }}
                    >
                      {getInitial(d.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{d.full_name}</div>
                      <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                        {d.scheduled_class_date
                          ? `aula ${new Date(d.scheduled_class_date + "T00:00:00").toLocaleDateString("pt-BR")} · ${d.booking_status ?? "agendado"}`
                          : "sem aula agendada"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-hv-amber">
                        {formatBRL(d.amount_paid_cents)}
                      </div>
                      <div className="hv-mono text-[10px] text-hv-text-3 mt-0.5">avulso</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {tab === "parceiros" && (
          <>
            {loadingPartners ? (
              <div className="hv-card px-3.5 py-6 text-center text-hv-text-3 text-sm">
                Carregando parceiros…
              </div>
            ) : !partners || partners.length === 0 ? (
              <div className="hv-card px-3.5 py-8 text-center">
                <div className="text-[13px] font-semibold text-hv-text">Sem alunos parceiros</div>
                <div className="text-[11px] text-hv-text-3 mt-1">
                  Conecte uma integração (Wellhub, Decathlon, etc.) para receber check-ins.
                </div>
              </div>
            ) : (
              partnersByProvider.map(([provider, list]) => (
                <div key={provider} className="hv-card overflow-hidden">
                  <div className="px-3.5 py-2 bg-hv-foam/40 border-b border-hv-line">
                    <div className="hv-mono text-[10px] text-hv-text-2 tracking-[0.12em] font-bold">
                      {(PROVIDER_LABEL[provider] || provider).toUpperCase()} · {list!.length}
                    </div>
                  </div>
                  {list!.map((p, i, arr) => {
                    const color = COLORS[(i + 1) % COLORS.length];
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => navigate(`/admin/parceiro/${p.id}`)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 px-3.5 py-3 hover:bg-hv-foam/30",
                          i < arr.length - 1 && "border-b border-hv-line",
                        )}
                      >
                        <div
                          className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-display font-bold shrink-0"
                          style={{ background: color }}
                        >
                          {getInitial(p.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold truncate">{p.full_name}</div>
                          <div className="text-[11px] text-hv-text-3 mt-0.5 truncate">
                            {p.plan_name || "—"} · {p.total_checkins ?? 0} check-ins
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[11px] text-hv-text-2">
                            {p.last_checkin_at
                              ? new Date(p.last_checkin_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "—"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}

        {loadingAlunos && tab === "mensalistas" && <Loader />}
      </div>

      {/* Modal Novo aluno */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Novo aluno"
        subtitle="MENSALISTA"
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
              disabled={
                createMut.isPending ||
                !form.full_name.trim() ||
                !form.email.trim() ||
                form.password.length < 6
              }
              className="px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white border-0"
              style={{
                background: "hsl(var(--hv-navy))",
                opacity:
                  !form.full_name.trim() || !form.email.trim() || form.password.length < 6
                    ? 0.5
                    : 1,
              }}
            >
              {createMut.isPending ? "Criando..." : "Criar aluno"}
            </button>
          </>
        }
      >
        <FieldText
          label="Nome completo"
          value={form.full_name}
          onChange={(v) => setForm({ ...form, full_name: v })}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <FieldText
            label="CPF"
            value={form.cpf}
            onChange={(v) => setForm({ ...form, cpf: formatCpfBR(v) })}
            placeholder="000.000.000-00"
          />
          <FieldText
            label="Nascimento"
            value={form.birthdate}
            onChange={(v) => setForm({ ...form, birthdate: v })}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <FieldText
          label="Email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
          placeholder="email@dominio.com"
        />
        <div className="grid grid-cols-2 gap-2">
          <FieldText
            label="Senha (mín. 6)"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required
            placeholder="••••••"
          />
          <FieldText
            label="Telefone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: formatPhoneBR(v) })}
            placeholder="(11) 91234-5678"
          />
        </div>
        <FieldSelect
          label="Plano"
          value={form.plan_id}
          options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${formatBRL(p.price_cents)}` }))}
          onChange={(v) => setForm({ ...form, plan_id: v })}
          placeholderOption="Sem plano"
        />
        <FieldText
          label="Endereço"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
        />
        <div className="grid grid-cols-2 gap-2">
          <FieldText
            label="Contato de emergência"
            value={form.emergency_contact_name}
            onChange={(v) => setForm({ ...form, emergency_contact_name: v })}
          />
          <FieldText
            label="Tel. emergência"
            value={form.emergency_contact_phone}
            onChange={(v) => setForm({ ...form, emergency_contact_phone: formatPhoneBR(v) })}
          />
        </div>
        <FieldTextArea
          label="Observações médicas"
          value={form.medical_notes}
          onChange={(v) => setForm({ ...form, medical_notes: v })}
        />
      </Modal>
    </div>
  );
}
