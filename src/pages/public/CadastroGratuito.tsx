// CadastroGratuito — versão grátis do cadastro público.
// Mesma estrutura do `student/Cadastro.tsx` MAS sem etapa de plano e sem PIX:
// chama edge `create-free-signup`, que já cria auth user + student.
// Rotas: /cadastro/gratuito e /:slug/cadastro/gratuito

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useTenantBySlug } from "@/hooks/useTenantBySlug";
import { useCreateFreeSignup } from "@/hooks/usePublicSignup";
import { useCepLookup, formatCep } from "@/hooks/useCepLookup";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { formatPhone, isValidPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FormState {
  email: string;
  full_name: string;
  nickname: string;
  cpf: string;
  birthdate: string; // DD/MM/AAAA
  phone: string;
  postal_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  can_swim: "yes" | "no";
  medical_notes: string;
  gender: "M" | "F" | "O";
  password: string;
  confirm_password: string;
  consent_signed: boolean;
}

const INITIAL: FormState = {
  email: "",
  full_name: "",
  nickname: "",
  cpf: "",
  birthdate: "",
  phone: "",
  postal_code: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  blood_type: "unknown",
  can_swim: "yes",
  medical_notes: "",
  gender: "O",
  password: "",
  confirm_password: "",
  consent_signed: false,
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];
const GENDER_OPTIONS: { id: FormState["gender"]; label: string }[] = [
  { id: "M", label: "Masculino" },
  { id: "F", label: "Feminino" },
  { id: "O", label: "Outro" },
];

const GENDER_MAP: Record<FormState["gender"], string> = {
  M: "masculino",
  F: "feminino",
  O: "outro",
};

function formatBirthdate(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function isValidBirthdate(v: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return false;
  const [day, month, year] = v.split("/").map(Number);
  if (!day || !month || !year || year < 1900) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year &&
    date <= new Date()
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px] block">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <div className="text-[11px] text-hv-coral mt-1">{error}</div>
      ) : hint ? (
        <div className="text-[11px] text-hv-text-3 mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

const textInputClasses =
  "w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy";

export default function CadastroGratuito() {
  const navigate = useNavigate();
  // Mesma convenção do Cadastro normal (param `tenantSlug`).
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { data: tenant, isLoading: tenantLoading } = useTenantBySlug(tenantSlug);
  const cepLookup = useCepLookup();
  const createFreeSignup = useCreateFreeSignup();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleCepBlur = async () => {
    const cep = form.postal_code.replace(/\D/g, "");
    if (cep.length !== 8) return;
    const result = await cepLookup.searchCep(cep);
    if (result) {
      setForm((f) => ({
        ...f,
        street: result.street || f.street,
        neighborhood: result.neighborhood || f.neighborhood,
        city: result.city || f.city,
        state: result.state || f.state,
      }));
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email inválido";
    if (!form.full_name || form.full_name.trim().length < 3)
      errs.full_name = "Nome muito curto";
    if (!isValidCPF(form.cpf)) errs.cpf = "CPF inválido";
    if (!isValidBirthdate(form.birthdate)) errs.birthdate = "Data inválida (DD/MM/AAAA)";
    if (!isValidPhone(form.phone)) errs.phone = "Telefone inválido";
    if (form.postal_code.replace(/\D/g, "").length !== 8) errs.postal_code = "CEP inválido";
    if (!form.street.trim()) errs.street = "Rua obrigatória";
    if (!form.number.trim()) errs.number = "Número obrigatório";
    if (!form.neighborhood.trim()) errs.neighborhood = "Bairro obrigatório";
    if (!form.city.trim()) errs.city = "Cidade obrigatória";
    if (!form.state.trim() || form.state.length !== 2) errs.state = "UF inválido";
    if (!form.emergency_contact_name.trim())
      errs.emergency_contact_name = "Contato obrigatório";
    if (!isValidPhone(form.emergency_contact_phone))
      errs.emergency_contact_phone = "Telefone inválido";
    if (form.password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (form.password !== form.confirm_password)
      errs.confirm_password = "Senhas não coincidem";
    if (!form.consent_signed) errs.consent_signed = "Aceite o termo";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!tenant?.id) {
      toast.error("Tenant não encontrado");
      return;
    }
    if (!validate()) {
      toast.error("Confira os campos destacados");
      return;
    }
    const [day, month, year] = form.birthdate.split("/");
    const birthdateISO = `${year}-${month}-${day}`;

    const fullAddress = [
      form.street,
      form.number ? `, ${form.number}` : "",
      form.complement ? ` - ${form.complement}` : "",
      ` - ${form.neighborhood}`,
      `, ${form.city} - ${form.state}`,
      `, CEP ${form.postal_code}`,
    ].join("");

    try {
      await createFreeSignup.mutateAsync({
        tenant_id: tenant.id,
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        nickname: form.nickname.trim() || null,
        cpf: form.cpf,
        birthdate: birthdateISO,
        phone: form.phone,
        address: fullAddress,
        postal_code: form.postal_code,
        address_number: form.number,
        emergency_contact_name: form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone,
        blood_type: form.blood_type,
        can_swim: form.can_swim === "yes",
        medical_notes: form.medical_notes.trim() || null,
        gender: GENDER_MAP[form.gender],
        // Plano grátis: edge aceita `plan_id` opcional; passamos vazio
        // (string vazia é convertida em `null` no backend via check `none`).
        plan_id: "",
        password: form.password,
      });

      toast.success("Cadastro grátis confirmado!");
      const target = tenantSlug ? `/${tenantSlug}/cadastro/sucesso` : "/cadastro/sucesso";
      navigate(target, {
        state: {
          tenantName: tenant.name,
          slug: tenantSlug,
          free: true,
        },
      });
    } catch {
      // toast já é disparado dentro do hook
    }
  };

  if (tenantLoading) return <Loader />;

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6 text-center">
        <div>
          <div className="font-display text-[22px] text-hv-navy">Filial não encontrada</div>
          <div className="text-sm text-hv-text-2 mt-2">
            Confira o link de cadastro com sua filial.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-1.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[12px] border border-hv-line bg-hv-surface grid place-items-center text-foreground hover:bg-hv-foam"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <div className="hv-mono flex-1 text-[10px] text-hv-text-3 tracking-[0.16em]">
          CADASTRO GRÁTIS
        </div>
        <span className="hv-chip capitalize">{tenant.name}</span>
      </div>

      <div className="px-5 mt-2">
        <h1 className="font-display text-[26px] leading-[1.05]">Bora começar a remar</h1>
        <p className="text-[13px] text-hv-text-2 mt-1.5 leading-[1.5]">
          Preencha seus dados. Sem cobrança — sua conta é liberada na hora.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hv-foam">
          <HVIcon name="check" size={14} color="hsl(var(--hv-leaf))" stroke={2.4} />
          <span className="hv-mono text-[11px] font-bold tracking-wider">CADASTRO GRATUITO</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-4 pb-6">
        {/* Identidade */}
        <h3 className="hv-eyebrow mt-3 mb-2">Identidade</h3>
        <Field label="Nome completo" error={errors.full_name}>
          <input
            className={textInputClasses}
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Como aparece no documento"
          />
        </Field>
        <Field label="Apelido (opcional)">
          <input
            className={textInputClasses}
            value={form.nickname}
            onChange={(e) => set("nickname", e.target.value)}
            placeholder="Como você quer ser chamado"
          />
        </Field>
        <Field label="E-mail" error={errors.email}>
          <input
            type="email"
            className={textInputClasses}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="seu@email.com"
          />
        </Field>
        <Field label="CPF" error={errors.cpf}>
          <input
            className={textInputClasses}
            value={form.cpf}
            onChange={(e) => set("cpf", formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
        </Field>
        <Field label="Data de nascimento" error={errors.birthdate}>
          <input
            className={textInputClasses}
            value={form.birthdate}
            onChange={(e) => set("birthdate", formatBirthdate(e.target.value))}
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
          />
        </Field>
        <Field label="Celular" hint="Pra confirmação por WhatsApp" error={errors.phone}>
          <input
            className={textInputClasses}
            value={form.phone}
            onChange={(e) => set("phone", formatPhone(e.target.value))}
            placeholder="(XX) XXXXX-XXXX"
            inputMode="numeric"
          />
        </Field>
        <Field label="Gênero">
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => set("gender", g.id)}
                className={cn(
                  "flex-1 h-11 rounded-[12px] border text-sm font-semibold",
                  form.gender === g.id
                    ? "border-hv-navy bg-hv-foam text-hv-navy"
                    : "border-hv-line bg-hv-surface text-hv-text-2",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Endereço */}
        <h3 className="hv-eyebrow mt-5 mb-2">Endereço</h3>
        <Field label="CEP" error={errors.postal_code || cepLookup.error || undefined}>
          <input
            className={textInputClasses}
            value={form.postal_code}
            onChange={(e) => set("postal_code", formatCep(e.target.value))}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            inputMode="numeric"
          />
        </Field>
        <Field label="Rua" error={errors.street}>
          <input
            className={textInputClasses}
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Número" error={errors.number}>
            <input
              className={textInputClasses}
              value={form.number}
              onChange={(e) => set("number", e.target.value)}
            />
          </Field>
          <Field label="Complemento">
            <input
              className={textInputClasses}
              value={form.complement}
              onChange={(e) => set("complement", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Bairro" error={errors.neighborhood}>
          <input
            className={textInputClasses}
            value={form.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Cidade" error={errors.city}>
            <input
              className={textInputClasses}
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="UF" error={errors.state}>
            <input
              className={textInputClasses}
              value={form.state}
              onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
          </Field>
        </div>

        {/* Emergência + saúde */}
        <h3 className="hv-eyebrow mt-5 mb-2">Saúde & emergência</h3>
        <Field label="Contato de emergência" error={errors.emergency_contact_name}>
          <input
            className={textInputClasses}
            value={form.emergency_contact_name}
            onChange={(e) => set("emergency_contact_name", e.target.value)}
            placeholder="Nome completo"
          />
        </Field>
        <Field label="Celular do contato" error={errors.emergency_contact_phone}>
          <input
            className={textInputClasses}
            value={form.emergency_contact_phone}
            onChange={(e) => set("emergency_contact_phone", formatPhone(e.target.value))}
            placeholder="(XX) XXXXX-XXXX"
            inputMode="numeric"
          />
        </Field>
        <Field label="Tipo sanguíneo">
          <select
            className={textInputClasses}
            value={form.blood_type}
            onChange={(e) => set("blood_type", e.target.value)}
          >
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b === "unknown" ? "Não sei" : b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sabe nadar?">
          <div className="flex gap-2">
            {[
              { id: "yes", label: "Sim" },
              { id: "no", label: "Não" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("can_swim", opt.id as FormState["can_swim"])}
                className={cn(
                  "flex-1 h-11 rounded-[12px] border text-sm font-semibold",
                  form.can_swim === opt.id
                    ? "border-hv-navy bg-hv-foam text-hv-navy"
                    : "border-hv-line bg-hv-surface text-hv-text-2",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Observações médicas (opcional)">
          <textarea
            className={cn(textInputClasses, "min-h-[80px]")}
            value={form.medical_notes}
            onChange={(e) => set("medical_notes", e.target.value)}
            placeholder="Alergias, cirurgias, medicamentos…"
          />
        </Field>

        {/* Senha */}
        <h3 className="hv-eyebrow mt-5 mb-2">Crie sua senha</h3>
        <Field label="Senha" error={errors.password}>
          <input
            type="password"
            className={textInputClasses}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </Field>
        <Field label="Confirmar senha" error={errors.confirm_password}>
          <input
            type="password"
            className={textInputClasses}
            value={form.confirm_password}
            onChange={(e) => set("confirm_password", e.target.value)}
          />
        </Field>

        {/* Termo */}
        <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 accent-hv-navy"
            checked={form.consent_signed}
            onChange={(e) => set("consent_signed", e.target.checked)}
          />
          <span className="text-[12px] text-hv-text-2 leading-[1.5]">
            Li e aceito os <u>termos do clube</u> e o <u>questionário de saúde</u>.
          </span>
        </label>
        {errors.consent_signed && (
          <div className="text-[11px] text-hv-coral mt-1">{errors.consent_signed}</div>
        )}

        <button
          type="button"
          disabled={createFreeSignup.isPending}
          onClick={handleSubmit}
          className="w-full mt-6 px-3.5 py-3.5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {createFreeSignup.isPending ? "Enviando…" : "Finalizar cadastro grátis"}
          <HVIcon name="arrow-right" size={16} stroke={2.4} />
        </button>
        <p className="text-[11px] text-hv-text-3 text-center mt-2.5 leading-[1.5]">
          Acesso liberado na hora. Sem cartão, sem pagamento.
        </p>
      </div>
    </div>
  );
}
