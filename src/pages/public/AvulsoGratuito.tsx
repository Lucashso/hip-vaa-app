// AvulsoGratuito — drop-in (aula avulsa) versão grátis (sem PIX).
// Espelha `Avulso.tsx` MAS chama edge `create-free-drop-in` e navega pro
// fluxo de agendamento de aula (`/avulso/agendado`).
// Rotas: /avulso/gratuito e /:slug/avulso/gratuito

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { useTenantBySlug } from "@/hooks/useTenantBySlug";
import { useCreateFreeDropIn } from "@/hooks/useDropInSignup";
import { useCepLookup, formatCep } from "@/hooks/useCepLookup";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { formatPhone, isValidPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FormState {
  email: string;
  full_name: string;
  cpf: string;
  birthdate: string;
  phone: string;
  postal_code: string;
  number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_type: string;
  can_swim: "yes" | "no";
  medical_notes: string;
  gender: "M" | "F" | "O";
  consent_signed: boolean;
}

const INITIAL: FormState = {
  email: "",
  full_name: "",
  cpf: "",
  birthdate: "",
  phone: "",
  postal_code: "",
  number: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  blood_type: "unknown",
  can_swim: "yes",
  medical_notes: "",
  gender: "O",
  consent_signed: false,
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];
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

const textInputClasses =
  "w-full px-3.5 py-3 rounded-[12px] border-[1.5px] border-hv-line bg-hv-surface text-sm focus:outline-none focus:border-hv-navy";

export default function AvulsoGratuito() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const { data: tenant, isLoading: tenantLoading } = useTenantBySlug(slug);
  const createFreeDropIn = useCreateFreeDropIn();
  const cepLookup = useCepLookup();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleCepBlur = async () => {
    const cep = form.postal_code.replace(/\D/g, "");
    if (cep.length !== 8) return;
    await cepLookup.searchCep(cep);
  };

  useEffect(() => {
    if (cepLookup.error) {
      setErrors((e) => ({ ...e, postal_code: cepLookup.error || undefined }));
    }
  }, [cepLookup.error]);

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email inválido";
    if (!form.full_name || form.full_name.trim().length < 3) errs.full_name = "Nome muito curto";
    if (!isValidCPF(form.cpf)) errs.cpf = "CPF inválido";
    if (!isValidBirthdate(form.birthdate)) errs.birthdate = "Data inválida";
    if (!isValidPhone(form.phone)) errs.phone = "Telefone inválido";
    if (!form.emergency_contact_name.trim())
      errs.emergency_contact_name = "Contato obrigatório";
    if (!isValidPhone(form.emergency_contact_phone))
      errs.emergency_contact_phone = "Telefone inválido";
    if (!form.consent_signed) errs.consent_signed = "Aceite o termo";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!tenant?.id) {
      toast.error("Filial não encontrada");
      return;
    }
    if (!validate()) {
      toast.error("Confira os campos destacados");
      return;
    }
    const [day, month, year] = form.birthdate.split("/");
    const birthdateISO = `${year}-${month}-${day}`;

    try {
      const res = await createFreeDropIn.mutateAsync({
        tenant_id: tenant.id,
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        cpf: form.cpf,
        birthdate: birthdateISO,
        phone: form.phone,
        postal_code: form.postal_code || undefined,
        address_number: form.number || undefined,
        emergency_contact_name: form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone,
        blood_type: form.blood_type,
        can_swim: form.can_swim === "yes",
        medical_notes: form.medical_notes.trim() || null,
        gender: GENDER_MAP[form.gender],
      });

      toast.success("Cadastro grátis confirmado!");
      const target = slug ? `/${slug}/avulso/agendado` : "/avulso/agendado";
      navigate(target, {
        state: {
          dropInStudentId: res.drop_in_student_id,
          tenantId: tenant.id,
          tenantName: tenant.name,
          slug,
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div
        className="px-5 pt-4 pb-5 text-white"
        style={{ background: "linear-gradient(135deg, #061826, #1B6FB0)" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[12px] bg-white/15 grid place-items-center text-white"
        >
          <HVIcon name="chevron-left" size={18} />
        </button>
        <h1 className="text-white font-display text-[26px] mt-3">Aula avulsa grátis</h1>
        <p className="text-[13px] opacity-85 mt-1 leading-[1.5]">
          Sem matrícula, sem cobrança. Você se cadastra agora e escolhe a aula no próximo passo
          em {tenant.name}.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15">
          <HVIcon name="check" size={14} color="white" stroke={2.4} />
          <span className="hv-mono text-[11px] font-bold tracking-wider">CORTESIA · 1 AULA</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-4 pb-6">
        <h3 className="hv-eyebrow mb-2">Seus dados</h3>
        <Input label="Nome completo" value={form.full_name} onChange={(v) => set("full_name", v)} error={errors.full_name} />
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
          error={errors.email}
        />
        <Input
          label="CPF"
          value={form.cpf}
          onChange={(v) => set("cpf", formatCPF(v))}
          placeholder="000.000.000-00"
          error={errors.cpf}
        />
        <Input
          label="Data de nascimento"
          value={form.birthdate}
          onChange={(v) => set("birthdate", formatBirthdate(v))}
          placeholder="DD/MM/AAAA"
          error={errors.birthdate}
        />
        <Input
          label="Celular"
          value={form.phone}
          onChange={(v) => set("phone", formatPhone(v))}
          placeholder="(XX) XXXXX-XXXX"
          error={errors.phone}
        />

        <h3 className="hv-eyebrow mt-5 mb-2">Endereço (opcional)</h3>
        <Input
          label="CEP"
          value={form.postal_code}
          onChange={(v) => set("postal_code", formatCep(v))}
          onBlur={handleCepBlur}
          placeholder="00000-000"
          error={errors.postal_code}
        />
        <Input label="Número" value={form.number} onChange={(v) => set("number", v)} />

        <h3 className="hv-eyebrow mt-5 mb-2">Saúde & emergência</h3>
        <Input
          label="Contato de emergência"
          value={form.emergency_contact_name}
          onChange={(v) => set("emergency_contact_name", v)}
          error={errors.emergency_contact_name}
        />
        <Input
          label="Celular do contato"
          value={form.emergency_contact_phone}
          onChange={(v) => set("emergency_contact_phone", formatPhone(v))}
          placeholder="(XX) XXXXX-XXXX"
          error={errors.emergency_contact_phone}
        />
        <div className="mb-3">
          <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
            Tipo sanguíneo
          </label>
          <select
            className={cn(textInputClasses, "mt-1.5")}
            value={form.blood_type}
            onChange={(e) => set("blood_type", e.target.value)}
          >
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b === "unknown" ? "Não sei" : b}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
            Sabe nadar?
          </label>
          <div className="flex gap-2 mt-1.5">
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
        </div>
        <div className="mb-3">
          <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
            Observações médicas (opcional)
          </label>
          <textarea
            className={cn(textInputClasses, "mt-1.5 min-h-[80px]")}
            value={form.medical_notes}
            onChange={(e) => set("medical_notes", e.target.value)}
          />
        </div>

        <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 accent-hv-navy"
            checked={form.consent_signed}
            onChange={(e) => set("consent_signed", e.target.checked)}
          />
          <span className="text-[12px] text-hv-text-2 leading-[1.5]">
            Li e aceito o <u>termo de drop-in</u>.
          </span>
        </label>
        {errors.consent_signed && (
          <div className="text-[11px] text-hv-coral mt-1">{errors.consent_signed}</div>
        )}

        <button
          type="button"
          disabled={createFreeDropIn.isPending}
          onClick={handleSubmit}
          className="w-full mt-6 px-3.5 py-3.5 rounded-[14px] bg-hv-cyan text-hv-ink font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {createFreeDropIn.isPending ? "Enviando…" : "Continuar e escolher aula"}
          <HVIcon name="arrow-right" size={16} stroke={2.4} />
        </button>
      </div>
    </div>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
}

function Input(props: InputProps) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-bold text-hv-text-2 uppercase tracking-[1px]">
        {props.label}
      </label>
      <input
        type={props.type ?? "text"}
        className={cn(textInputClasses, "mt-1.5")}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={props.onBlur}
        placeholder={props.placeholder}
      />
      {props.error && <div className="text-[11px] text-hv-coral mt-1">{props.error}</div>}
    </div>
  );
}
