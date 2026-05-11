// SuperAdmin · Criar nova filial — wizard 3 passos com wiring real.
// Backend: edge function `create-tenant` + tabela `platform_plans`.

import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SuperShell } from "@/components/SuperShell";
import { HVIcon } from "@/lib/HVIcon";
import {
  useCheckSlugAvailable,
  usePlatformPlans,
  useCreateTenantMutation,
} from "@/hooks/useSuper";
import { formatBRL } from "@/lib/utils";
import { toast } from "sonner";

interface FormState {
  name: string;
  slug: string;
  document: string;
  address: string;
  business_template: string;
  platform_plan_id: string | null;
  responsible_name: string;
  responsible_email: string;
  responsible_phone: string;
  responsible_cpf: string;
  responsible_password: string;
  accept_terms: boolean;
}

const INITIAL: FormState = {
  name: "",
  slug: "",
  document: "",
  address: "",
  business_template: "rowing",
  platform_plan_id: null,
  responsible_name: "",
  responsible_email: "",
  responsible_phone: "",
  responsible_cpf: "",
  responsible_password: "",
  accept_terms: false,
};

const STEPS = [
  { n: 1, l: "Dados da filial" },
  { n: 2, l: "Plano & responsável" },
  { n: 3, l: "Confirmação" },
];

const BUSINESS_TEMPLATES = [
  { id: "rowing", label: "Remo / Canoa havaiana" },
  { id: "fitness", label: "Academia / Fitness" },
  { id: "running", label: "Corrida / Atletismo" },
  { id: "swimming", label: "Natação" },
  { id: "other", label: "Outro" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .substring(0, 30);
}

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: "hsl(var(--hv-text-2))",
  letterSpacing: 1.2,
} as const;

const inputStyle = {
  marginTop: 6,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid hsl(var(--hv-line))",
  background: "white",
  fontSize: 13,
  fontWeight: 500,
  width: "100%",
  outline: "none",
  display: "block",
} as const;

export default function SuperCriarTenant() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);

  const slugStatus = useCheckSlugAvailable(form.slug);
  const { data: plans = [], isLoading: plansLoading } = usePlatformPlans(true);
  const createMut = useCreateTenantMutation();

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleNameChange = (value: string) => {
    setForm((f) => {
      const auto = !f.slug || f.slug === slugify(f.name);
      return { ...f, name: value, slug: auto ? slugify(value) : f.slug };
    });
  };

  const selectedPlan = plans.find((p) => p.id === form.platform_plan_id);

  const previewName = form.name || "Nova filial";
  const previewSlug = form.slug ? `hipvaa.app/${form.slug}` : "hipvaa.app/nova";

  const checklist = [
    {
      l: "Dados validados",
      on: !!form.name && slugStatus === "available",
    },
    {
      l: "CNPJ ativo na Receita",
      on: !!form.document && form.document.length >= 14,
    },
    { l: "Plano contratado", on: !!form.platform_plan_id },
    { l: "Responsável definido", on: !!form.responsible_email && !!form.responsible_password },
    { l: "Termos aceitos", on: form.accept_terms },
  ];

  // Validação por passo
  const step1Valid =
    !!form.name &&
    !!form.slug &&
    slugStatus === "available" &&
    !!form.document &&
    !!form.address &&
    !!form.business_template;

  const step2Valid =
    !!form.platform_plan_id &&
    !!form.responsible_name &&
    !!form.responsible_email &&
    !!form.responsible_phone &&
    !!form.responsible_cpf &&
    !!form.responsible_password &&
    form.responsible_password.length >= 6;

  const step3Valid = form.accept_terms;

  const handleNext = () => {
    if (step === 1) {
      if (!step1Valid) {
        if (slugStatus !== "available")
          toast.error("Slug inválido ou indisponível");
        else toast.error("Preencha todos os campos");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!step2Valid) {
        toast.error("Preencha os dados do plano e responsável");
        return;
      }
      setStep(3);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!step3Valid) {
      toast.error("É necessário aceitar os termos");
      return;
    }
    try {
      await createMut.mutateAsync({
        name: form.name,
        slug: form.slug,
        business_template: form.business_template,
        feature_flags: {},
        platform_plan_id: form.platform_plan_id,
        ownerName: form.responsible_name,
        ownerEmail: form.responsible_email,
        ownerPhone: form.responsible_phone.replace(/\D/g, ""),
        ownerPassword: form.responsible_password,
        document: form.document,
        address: form.address,
      });
      navigate("/rede");
    } catch {
      // toast já disparado no onError
    }
  };

  const submitting = createMut.isPending;

  return (
    <SuperShell active="Filiais" sub="CRIAR NOVA FILIAL" title="Wizard de nova franquia">
      {/* Stepper */}
      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        {STEPS.map((s, i) => {
          const on = step === s.n;
          const done = step > s.n;
          return (
            <Fragment key={s.n}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: on || done ? "hsl(var(--hv-navy))" : "hsl(var(--hv-bg))",
                    color: on || done ? "white" : "hsl(var(--hv-text-3))",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    border: on || done ? "none" : "1px solid hsl(var(--hv-line))",
                  }}
                >
                  {done ? <HVIcon name="check" size={16} stroke={3} /> : s.n}
                </div>
                <div>
                  <div
                    className="hv-mono"
                    style={{ fontSize: 9, color: "hsl(var(--hv-text-3))", letterSpacing: 1 }}
                  >
                    PASSO {s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: on ? 700 : 500,
                      color: on ? "hsl(var(--hv-text))" : "hsl(var(--hv-text-3))",
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 0.4,
                    height: 2,
                    background: "hsl(var(--hv-line))",
                    alignSelf: "center",
                  }}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        {/* Form */}
        <div className="hv-card" style={{ padding: 22 }}>
          <div
            className="hv-mono"
            style={{
              fontSize: 10,
              color: "hsl(var(--hv-text-3))",
              letterSpacing: 1.2,
              fontWeight: 700,
            }}
          >
            {step === 1 ? "DADOS DA FILIAL" : step === 2 ? "PLANO & RESPONSÁVEL" : "CONFIRMAÇÃO"}
          </div>
          <h3
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 22,
              marginTop: 4,
              marginBottom: 14,
              fontWeight: 700,
            }}
          >
            {step === 1
              ? "Identificação"
              : step === 2
                ? "Plano & franqueado"
                : "Revisar e criar"}
          </h3>

          {step === 1 && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className="hv-mono" style={labelStyle}>
                  Nome da filial
                </label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Hip Va'a Recife"
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: "hsl(var(--hv-text-3))", marginTop: 4 }}>
                  como aparece para os alunos
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="hv-mono" style={labelStyle}>
                  Slug (URL)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      update(
                        "slug",
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
                      )
                    }
                    placeholder="ex: hipvaarecife"
                    style={{
                      ...inputStyle,
                      paddingRight: 36,
                      borderColor:
                        slugStatus === "available"
                          ? "hsl(var(--hv-leaf))"
                          : slugStatus === "taken"
                            ? "hsl(var(--hv-coral))"
                            : slugStatus === "invalid"
                              ? "hsl(var(--hv-amber))"
                              : "hsl(var(--hv-line))",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {slugStatus === "checking" && (
                      <Loader2
                        size={14}
                        className="animate-spin"
                        color="hsl(var(--hv-text-3))"
                      />
                    )}
                    {slugStatus === "available" && (
                      <HVIcon name="check" size={14} color="hsl(var(--hv-leaf))" stroke={3} />
                    )}
                    {slugStatus === "taken" && (
                      <HVIcon name="x" size={14} color="hsl(var(--hv-coral))" stroke={3} />
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    color:
                      slugStatus === "available"
                        ? "hsl(var(--hv-leaf))"
                        : slugStatus === "taken"
                          ? "hsl(var(--hv-coral))"
                          : slugStatus === "invalid"
                            ? "hsl(var(--hv-amber))"
                            : "hsl(var(--hv-text-3))",
                  }}
                >
                  {slugStatus === "available" && "✓ Slug disponível"}
                  {slugStatus === "taken" && "✗ Slug já em uso"}
                  {slugStatus === "invalid" && "Mínimo 3 caracteres"}
                  {(slugStatus === "idle" || slugStatus === "checking") &&
                    `URL pública: hipvaa.app/${form.slug || "slug"}`}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="hv-mono" style={labelStyle}>
                  CNPJ
                </label>
                <input
                  value={form.document}
                  onChange={(e) => update("document", e.target.value)}
                  placeholder="00.000.000/0000-00"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="hv-mono" style={labelStyle}>
                  Endereço
                </label>
                <input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Rua, número, bairro, cidade/UF"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="hv-mono" style={labelStyle}>
                  Tipo de negócio
                </label>
                <select
                  value={form.business_template}
                  onChange={(e) => update("business_template", e.target.value)}
                  style={inputStyle}
                >
                  {BUSINESS_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label className="hv-mono" style={labelStyle}>
                  Plano da plataforma
                </label>
                {plansLoading ? (
                  <div style={{ marginTop: 8, fontSize: 13, color: "hsl(var(--hv-text-3))" }}>
                    Carregando planos...
                  </div>
                ) : (
                  <select
                    value={form.platform_plan_id ?? ""}
                    onChange={(e) =>
                      update("platform_plan_id", e.target.value || null)
                    }
                    style={inputStyle}
                  >
                    <option value="">Selecione um plano</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatBRL(p.price_cents)} (
                        {p.billing_type === "monthly" ? "mensal" : p.billing_type})
                      </option>
                    ))}
                  </select>
                )}
                {selectedPlan?.description && (
                  <div
                    style={{ fontSize: 11, color: "hsl(var(--hv-text-3))", marginTop: 6 }}
                  >
                    {selectedPlan.description}
                  </div>
                )}
              </div>

              <div
                className="hv-mono"
                style={{
                  fontSize: 10,
                  color: "hsl(var(--hv-text-3))",
                  letterSpacing: 1.2,
                  fontWeight: 700,
                  marginTop: 4,
                  marginBottom: 8,
                }}
              >
                RESPONSÁVEL (FRANQUEADO)
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}
              >
                <div>
                  <label className="hv-mono" style={labelStyle}>Nome completo</label>
                  <input
                    value={form.responsible_name}
                    onChange={(e) => update("responsible_name", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="hv-mono" style={labelStyle}>E-mail</label>
                  <input
                    type="email"
                    value={form.responsible_email}
                    onChange={(e) => update("responsible_email", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="hv-mono" style={labelStyle}>Telefone</label>
                  <input
                    value={form.responsible_phone}
                    onChange={(e) =>
                      update("responsible_phone", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="11999999999"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="hv-mono" style={labelStyle}>CPF</label>
                  <input
                    value={form.responsible_cpf}
                    onChange={(e) => update("responsible_cpf", e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="hv-mono" style={labelStyle}>Senha inicial</label>
                <input
                  type="password"
                  value={form.responsible_password}
                  onChange={(e) => update("responsible_password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: "hsl(var(--hv-text-3))", marginTop: 4 }}>
                  O franqueado poderá alterar depois.
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div>
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "hsl(var(--hv-foam))",
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Filial</div>
                <div style={{ fontSize: 13 }}>
                  <strong>{form.name}</strong> · {form.slug}
                </div>
                <div style={{ fontSize: 12, color: "hsl(var(--hv-text-2))", marginTop: 4 }}>
                  {form.document} — {form.address}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "hsl(var(--hv-foam))",
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Plano</div>
                <div style={{ fontSize: 13 }}>
                  {selectedPlan
                    ? `${selectedPlan.name} — ${formatBRL(selectedPlan.price_cents)}`
                    : "—"}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "hsl(var(--hv-foam))",
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Responsável</div>
                <div style={{ fontSize: 13 }}>
                  {form.responsible_name} · {form.responsible_email}
                </div>
                <div style={{ fontSize: 12, color: "hsl(var(--hv-text-2))", marginTop: 4 }}>
                  {form.responsible_phone} — CPF {form.responsible_cpf}
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  marginTop: 6,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.accept_terms}
                  onChange={(e) => update("accept_terms", e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                  Aceito os termos de contrato de franquia. O franqueado receberá o contrato
                  para assinatura digital e a filial entrará em trial de 14 dias.
                </span>
              </label>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 22,
            }}
          >
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={submitting}
                style={{
                  padding: "11px 18px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "hsl(var(--hv-text))",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => navigate("/rede")}
              disabled={submitting}
              style={{
                padding: "11px 18px",
                borderRadius: 10,
                background: "hsl(var(--hv-bg))",
                border: "1px solid hsl(var(--hv-line))",
                fontSize: 13,
                fontWeight: 600,
                color: "hsl(var(--hv-text))",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleNext}
              disabled={submitting}
              style={{
                padding: "11px 18px",
                borderRadius: 10,
                background: "hsl(var(--hv-navy))",
                color: "white",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                gap: 8,
                alignItems: "center",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  {step < 3 ? "Continuar" : "Criar filial"}
                  <HVIcon name="arrow-right" size={14} stroke={2.4} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview + Checklist */}
        <div>
          <div
            className="hv-card"
            style={{
              padding: 18,
              background: "linear-gradient(140deg, #061826, #1B6FB0)",
              color: "white",
            }}
          >
            <div className="hv-mono" style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1.2 }}>
              PREVIEW
            </div>
            <h4
              style={{
                color: "white",
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 18,
                marginTop: 4,
                fontWeight: 700,
              }}
            >
              Hip Va'a · {previewName}
            </h4>
            <div className="hv-mono" style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
              {previewSlug}
            </div>
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
                Após criar, o tenant entra em <b>trial de 14 dias</b> e o franqueado recebe o
                contrato para assinatura digital.
              </div>
            </div>
          </div>

          <div className="hv-card" style={{ padding: 18, marginTop: 12 }}>
            <div
              className="hv-mono"
              style={{
                fontSize: 10,
                color: "hsl(var(--hv-text-3))",
                letterSpacing: 1.2,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              CHECKLIST
            </div>
            {checklist.map((c) => (
              <div
                key={c.l}
                style={{ display: "flex", gap: 10, padding: "8px 0", alignItems: "center" }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: c.on ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-bg))",
                    border: c.on ? "none" : "1px solid hsl(var(--hv-line))",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {c.on && <HVIcon name="check" size={12} color="white" stroke={3} />}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: c.on ? "hsl(var(--hv-text))" : "hsl(var(--hv-text-3))",
                  }}
                >
                  {c.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SuperShell>
  );
}
