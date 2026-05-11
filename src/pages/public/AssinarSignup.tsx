// AssinarSignup — wizard público de 3 passos pra abrir uma nova filial.
// Rota: /assinar
// Passo 1: dados da empresa + tipo de negócio
// Passo 2: plano + método de pagamento
// Passo 3: revisão + termos → cria pending_tenant_signup → /assinar/contrato

import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { HVIcon } from "@/lib/HVIcon";
import { HVLogo } from "@/components/HVLogo";
import { BusinessTemplateSelector } from "@/components/TenantSignup/BusinessTemplateSelector";
import {
  useCreatePendingTenant,
  type TenantSignupData,
} from "@/hooks/useTenantSignup";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { useCepLookup, formatCep } from "@/hooks/useCepLookup";
import { usePlatformPlans, type PlatformPlan } from "@/hooks/useSuper";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { formatPhone, isValidPhone } from "@/lib/phone";
import { cn, formatBRL } from "@/lib/utils";
import { toast } from "sonner";

type DocType = "cpf" | "cnpj";
type PaymentMethod = "pix" | "credit_card";

interface FormState {
  document_type: DocType;
  document: string;
  company_name: string;
  legal_name: string;
  responsible_name: string;
  email: string;
  phone: string;
  cep: string;
  address: string;
  address_number: string;
  neighborhood: string;
  city: string;
  state: string;
  business_template: string;
  platform_plan_id: string;
  payment_method: PaymentMethod;
  accept_terms: boolean;
}

const INITIAL: FormState = {
  document_type: "cnpj",
  document: "",
  company_name: "",
  legal_name: "",
  responsible_name: "",
  email: "",
  phone: "",
  cep: "",
  address: "",
  address_number: "",
  neighborhood: "",
  city: "",
  state: "",
  business_template: "",
  platform_plan_id: "",
  payment_method: "pix",
  accept_terms: false,
};

const STEPS = [
  { n: 1, l: "Dados da empresa" },
  { n: 2, l: "Plano & pagamento" },
  { n: 3, l: "Revisão" },
];

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatDocument(value: string, type: DocType): string {
  return type === "cpf" ? formatCPF(value) : formatCNPJ(value);
}

const inputClasses =
  "w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy";

export default function AssinarSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);

  const { data: plans = [], isLoading: plansLoading } = usePlatformPlans(true);
  const createPendingTenant = useCreatePendingTenant();
  const cepLookup = useCepLookup();
  const cnpjLookup = useCnpjLookup();

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Auto-busca CNPJ (debounced no hook) — só quando completos 14 dígitos
  useEffect(() => {
    if (form.document_type !== "cnpj") return;
    const digits = form.document.replace(/\D/g, "");
    if (digits.length === 14) {
      cnpjLookup.searchCnpj(form.document);
    } else if (digits.length === 0) {
      cnpjLookup.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.document, form.document_type]);

  // Aplica resultado do CNPJ no form
  useEffect(() => {
    const r = cnpjLookup.result;
    if (!r) return;
    setForm((f) => ({
      ...f,
      legal_name: f.legal_name || r.razao_social || "",
      company_name: f.company_name || r.nome_fantasia || r.razao_social || "",
      cep: f.cep || (r.cep ? formatCep(r.cep) : ""),
      address: f.address || r.logradouro || "",
      address_number: f.address_number || r.numero || "",
      neighborhood: f.neighborhood || r.bairro || "",
      city: f.city || r.municipio || "",
      state: f.state || r.uf || "",
    }));
  }, [cnpjLookup.result]);

  // Auto-busca CEP
  useEffect(() => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      cepLookup.searchCep(cep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cep]);

  useEffect(() => {
    const r = cepLookup.result;
    if (!r) return;
    setForm((f) => ({
      ...f,
      address: f.address || r.street || "",
      neighborhood: f.neighborhood || r.neighborhood || "",
      city: f.city || r.city || "",
      state: f.state || r.state || "",
    }));
  }, [cepLookup.result]);

  const selectedPlan: PlatformPlan | undefined = plans.find(
    (p) => p.id === form.platform_plan_id,
  );

  // Validações por passo
  const step1Valid =
    !!form.company_name.trim() &&
    !!form.responsible_name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    isValidPhone(form.phone) &&
    !!form.document.replace(/\D/g, "") &&
    (form.document_type === "cnpj"
      ? form.document.replace(/\D/g, "").length === 14
      : isValidCPF(form.document)) &&
    !!form.business_template;

  const step2Valid = !!form.platform_plan_id && !!form.payment_method;
  const step3Valid = form.accept_terms;

  const handleNext = () => {
    if (step === 1) {
      if (!step1Valid) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!step2Valid) {
        toast.error("Selecione um plano e método de pagamento");
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
    if (!selectedPlan) {
      toast.error("Plano não encontrado");
      return;
    }
    const amountCents = selectedPlan.price_cents;
    const data: TenantSignupData = {
      company_name: form.company_name.trim(),
      legal_name: form.legal_name.trim() || undefined,
      document_type: form.document_type,
      document: form.document,
      email: form.email.trim(),
      phone: form.phone,
      responsible_name: form.responsible_name.trim(),
      cep: form.cep || undefined,
      address: form.address || undefined,
      address_number: form.address_number || undefined,
      neighborhood: form.neighborhood || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      platform_plan_id: form.platform_plan_id,
      amount_cents: amountCents,
      business_template: form.business_template,
    };
    try {
      const res = await createPendingTenant.mutateAsync(data);
      navigate("/assinar/contrato", {
        state: {
          pendingSignupId: res.pending_signup_id,
          planName: selectedPlan.name,
          amountCents: res.amount_cents ?? amountCents,
          business_template: form.business_template,
          responsible_name: form.responsible_name.trim(),
          company_name: form.company_name.trim(),
          document: form.document,
          document_type: form.document_type,
          payment_method: form.payment_method,
        },
      });
    } catch {
      // toast já disparado no onError
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div
        className="px-5 pt-5 pb-6 text-white"
        style={{ background: "linear-gradient(135deg, #061826, #1B6FB0)" }}
      >
        <div className="flex items-center justify-between">
          <HVLogo />
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-[12px] text-white/80 underline-offset-2 hover:underline"
          >
            Já tenho conta
          </button>
        </div>
        <h1 className="text-white font-display text-[26px] mt-4">
          Comece a usar o Hip Va'a
        </h1>
        <p className="text-[13px] opacity-85 mt-1 leading-[1.5] max-w-[520px]">
          Plataforma completa para clubes de remo, canoa havaiana e equipamentos
          esportivos. Cadastre sua filial em minutos.
        </p>
      </div>

      {/* Stepper */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-2 max-w-[640px] mx-auto">
          {STEPS.map((s, i) => {
            const on = step === s.n;
            const done = step > s.n;
            return (
              <Fragment key={s.n}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full grid place-items-center font-display font-bold text-sm shrink-0",
                      on || done
                        ? "bg-hv-navy text-white"
                        : "bg-hv-surface border border-hv-line text-hv-text-3",
                    )}
                  >
                    {done ? <HVIcon name="check" size={14} stroke={3} /> : s.n}
                  </div>
                  <div className="min-w-0">
                    <div className="hv-mono text-[9px] text-hv-text-3 tracking-[0.14em]">
                      PASSO {s.n}
                    </div>
                    <div
                      className={cn(
                        "text-[12px] truncate",
                        on ? "text-hv-text font-bold" : "text-hv-text-3",
                      )}
                    >
                      {s.l}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-6 h-px bg-hv-line shrink-0" />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-3 pb-8">
        <div className="max-w-[640px] mx-auto">
          <div className="hv-card p-5">
            {step === 1 && (
              <>
                <h3 className="hv-eyebrow mb-3">Dados da empresa</h3>

                {/* Document type */}
                <div className="mb-3">
                  <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
                    Tipo de pessoa
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    {[
                      { id: "cnpj", label: "Pessoa Jurídica (CNPJ)" },
                      { id: "cpf", label: "Pessoa Física (CPF)" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          update("document_type", opt.id as DocType);
                          update("document", "");
                          cnpjLookup.reset();
                        }}
                        className={cn(
                          "flex-1 h-11 rounded-[12px] border text-sm font-semibold",
                          form.document_type === opt.id
                            ? "border-hv-navy bg-hv-foam text-hv-navy"
                            : "border-hv-line bg-hv-surface text-hv-text-2",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document */}
                <Field
                  label={form.document_type === "cpf" ? "CPF" : "CNPJ"}
                  value={form.document}
                  onChange={(v) =>
                    update("document", formatDocument(v, form.document_type))
                  }
                  placeholder={
                    form.document_type === "cpf"
                      ? "000.000.000-00"
                      : "00.000.000/0000-00"
                  }
                  hint={
                    form.document_type === "cnpj"
                      ? cnpjLookup.isLoading
                        ? "Buscando dados na Receita..."
                        : cnpjLookup.error ?? undefined
                      : undefined
                  }
                />

                {form.document_type === "cnpj" && (
                  <Field
                    label="Razão social"
                    value={form.legal_name}
                    onChange={(v) => update("legal_name", v)}
                    placeholder="Nome jurídico da empresa"
                  />
                )}

                <Field
                  label={
                    form.document_type === "cnpj"
                      ? "Nome fantasia"
                      : "Nome do negócio"
                  }
                  value={form.company_name}
                  onChange={(v) => update("company_name", v)}
                  placeholder="Ex: Hip Va'a Recife"
                  required
                />

                <Field
                  label="Nome do responsável"
                  value={form.responsible_name}
                  onChange={(v) => update("responsible_name", v)}
                  placeholder="Nome completo"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Field
                    label="E-mail"
                    type="email"
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    placeholder="email@empresa.com"
                    required
                  />
                  <Field
                    label="Telefone / WhatsApp"
                    value={form.phone}
                    onChange={(v) => update("phone", formatPhone(v))}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <h3 className="hv-eyebrow mt-5 mb-3">Endereço (opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Field
                    label="CEP"
                    value={form.cep}
                    onChange={(v) => update("cep", formatCep(v))}
                    placeholder="00000-000"
                  />
                  <Field
                    label="Cidade"
                    value={form.city}
                    onChange={(v) => update("city", v)}
                  />
                  <Field
                    label="UF"
                    value={form.state}
                    onChange={(v) => update("state", v.toUpperCase().slice(0, 2))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <Field
                      label="Endereço"
                      value={form.address}
                      onChange={(v) => update("address", v)}
                    />
                  </div>
                  <Field
                    label="Número"
                    value={form.address_number}
                    onChange={(v) => update("address_number", v)}
                  />
                </div>
                <Field
                  label="Bairro"
                  value={form.neighborhood}
                  onChange={(v) => update("neighborhood", v)}
                />

                <h3 className="hv-eyebrow mt-5 mb-3">Tipo de negócio</h3>
                <BusinessTemplateSelector
                  value={form.business_template}
                  onChange={(tmpl) => update("business_template", tmpl.id)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="hv-eyebrow mb-3">Escolha seu plano</h3>
                {plansLoading ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="animate-spin text-hv-text-3" size={20} />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-[13px] text-hv-text-3">
                    Nenhum plano disponível no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {plans.map((p) => {
                      const active = form.platform_plan_id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => update("platform_plan_id", p.id)}
                          className={cn(
                            "text-left p-4 rounded-[14px] border-[1.5px] transition-all",
                            active
                              ? "border-hv-navy bg-hv-foam"
                              : "border-hv-line bg-hv-surface hover:border-hv-navy/40",
                          )}
                        >
                          <div className="font-display text-[18px] font-bold text-hv-navy">
                            {p.name}
                          </div>
                          <div className="font-display text-[24px] font-extrabold mt-1">
                            {formatBRL(p.price_cents)}
                            <span className="text-[12px] text-hv-text-3 font-medium">
                              {p.billing_type === "monthly" ? " /mês" : ""}
                              {p.billing_type === "yearly_upfront"
                                ? " /ano"
                                : ""}
                            </span>
                          </div>
                          {p.description && (
                            <div className="text-[12px] text-hv-text-2 mt-2 leading-snug">
                              {p.description}
                            </div>
                          )}
                          {p.features.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {p.features.slice(0, 4).map((feat, i) => (
                                <li
                                  key={i}
                                  className="text-[12px] text-hv-text-2 flex items-start gap-1.5"
                                >
                                  <HVIcon
                                    name="check"
                                    size={14}
                                    color="hsl(var(--hv-leaf))"
                                    stroke={3}
                                  />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <h3 className="hv-eyebrow mt-5 mb-3">Método de pagamento</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "pix", label: "PIX", desc: "QR code instantâneo" },
                    {
                      id: "credit_card",
                      label: "Cartão de crédito",
                      desc: "Em até 12x",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        update("payment_method", opt.id as PaymentMethod)
                      }
                      className={cn(
                        "text-left p-3.5 rounded-[14px] border-[1.5px]",
                        form.payment_method === opt.id
                          ? "border-hv-navy bg-hv-foam"
                          : "border-hv-line bg-hv-surface",
                      )}
                    >
                      <div className="font-display text-[14px] font-bold">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-hv-text-2 mt-0.5">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="hv-eyebrow mb-3">Revisar dados</h3>
                <SummarySection title="Empresa">
                  <div>
                    <strong>{form.company_name}</strong>
                    {form.legal_name ? ` · ${form.legal_name}` : ""}
                  </div>
                  <div className="text-hv-text-2 text-[12px] mt-1">
                    {form.document_type.toUpperCase()}: {form.document}
                  </div>
                  <div className="text-hv-text-2 text-[12px]">
                    {form.responsible_name} · {form.email} · {form.phone}
                  </div>
                  {form.city && (
                    <div className="text-hv-text-2 text-[12px] mt-1">
                      {form.address}, {form.address_number} — {form.city}/
                      {form.state}
                    </div>
                  )}
                </SummarySection>

                <SummarySection title="Plano">
                  <div>
                    <strong>{selectedPlan?.name}</strong> ·{" "}
                    {selectedPlan ? formatBRL(selectedPlan.price_cents) : "—"}
                  </div>
                  <div className="text-hv-text-2 text-[12px] mt-1">
                    Pagamento:{" "}
                    {form.payment_method === "pix" ? "PIX" : "Cartão de crédito"}
                  </div>
                </SummarySection>

                <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 accent-hv-navy"
                    checked={form.accept_terms}
                    onChange={(e) => update("accept_terms", e.target.checked)}
                  />
                  <span className="text-[12px] text-hv-text-2 leading-[1.5]">
                    Li e aceito os <u>termos de uso</u> da plataforma. Confirmo
                    que ao continuar receberei um contrato digital pra assinar.
                  </span>
                </label>
              </>
            )}

            {/* Botões */}
            <div className="flex gap-2 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={createPendingTenant.isPending}
                  className="px-5 h-11 rounded-[12px] border border-hv-line bg-hv-surface text-sm font-semibold disabled:opacity-50"
                >
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={createPendingTenant.isPending}
                className="flex-1 h-11 rounded-[12px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                {createPendingTenant.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    {step < 3 ? "Continuar" : "Continuar para o contrato"}
                    <HVIcon name="arrow-right" size={16} stroke={2.4} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────── Helpers ─────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  hint,
}: FieldProps) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
        {label}
        {required && <span className="text-hv-coral"> *</span>}
      </label>
      <input
        type={type}
        className={cn(inputClasses, "mt-1.5")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <div className="text-[11px] text-hv-text-3 mt-1">{hint}</div>}
    </div>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-3.5 rounded-[12px] mb-2.5 text-[13px]"
      style={{ background: "hsl(var(--hv-foam))" }}
    >
      <div className="hv-mono text-[10px] text-hv-text-3 tracking-[0.14em] mb-1.5">
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}
