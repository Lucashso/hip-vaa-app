// ConverterStudent — fluxo de conversão drop-in → mensalista (passo 1).
// Rotas: /converter/:token e /:slug/converter/:token
// Read conversion by token. Form: senha + confirm + endereço + consent.
// Se amount_cents > 0 → /pagamento; senão → complete-conversion direto → /sucesso.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import {
  useConversionByToken,
  useCompleteConversion,
  type ConverterAddress,
} from "@/hooks/useConverter";
import { useCepLookup, formatCep } from "@/hooks/useCepLookup";
import { formatBRL } from "@/lib/utils";

export default function ConverterStudent() {
  const navigate = useNavigate();
  const { token, slug } = useParams<{ token: string; slug?: string }>();
  const { data: conversion, isLoading, error } = useConversionByToken(token);
  const completeConversion = useCompleteConversion();
  const cep = useCepLookup();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill from drop_in_student
  useEffect(() => {
    if (!conversion?.drop_in_student) return;
    const d = conversion.drop_in_student;
    if (d.postal_code) setPostalCode(formatCep(d.postal_code));
    if (d.address_number) setAddressNumber(d.address_number);
  }, [conversion?.drop_in_student]);

  // Update CEP fields when ViaCEP returns result
  useEffect(() => {
    if (!cep.result) return;
    if (cep.result.street) setAddress(cep.result.street);
    if (cep.result.neighborhood) setNeighborhood(cep.result.neighborhood);
    if (cep.result.city) setCity(cep.result.city);
    if (cep.result.state) setState(cep.result.state);
  }, [cep.result]);

  const isExpired = useMemo(
    () => !!conversion && new Date(conversion.expires_at) < new Date(),
    [conversion],
  );
  const isAlreadyProcessed = useMemo(
    () => !!conversion && conversion.status !== "pending" && conversion.status !== null,
    [conversion],
  );

  if (isLoading) return <Loader />;

  if (error || !conversion) {
    return (
      <EmptyState
        icon="x"
        title="Link inválido"
        message="Este link de conversão não existe."
      />
    );
  }

  if (isExpired) {
    return (
      <EmptyState
        icon="x"
        title="Link expirado"
        message="Este link de conversão expirou. Peça um novo à filial."
      />
    );
  }

  if (isAlreadyProcessed) {
    return (
      <EmptyState
        icon="check"
        title="Já processado"
        message="Este link já foi utilizado. Faça login na sua conta."
        cta={{ label: "Ir para o login", onClick: () => navigate("/auth") }}
      />
    );
  }

  const amountCents = conversion.amount_cents ?? 0;
  const planTotal =
    (conversion.plan?.price_cents ?? 0) + (conversion.plan?.signup_fee_cents ?? 0);
  const paidCents = conversion.drop_in_student?.amount_paid_cents ?? 0;
  const hasDiscount = !!conversion.apply_discount && paidCents > 0;
  const studentName =
    conversion.drop_in_student?.nickname ||
    conversion.drop_in_student?.full_name ||
    "Aluno";
  const tenantName = conversion.tenant?.name ?? "Sua filial";
  const tenantSlug = conversion.tenant?.slug || conversion.tenant?.domain || slug;
  const contractText =
    conversion.tenant?.contract_text || conversion.tenant?.drop_in_contract_text || null;

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setPostalCode(formatted);
    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 8) {
      cep.searchCep(formatted);
    }
  };

  const validate = (): string | null => {
    if (password.length < 6) return "Senha deve ter no mínimo 6 caracteres";
    if (password !== confirmPassword) return "Senhas não conferem";
    if (!address.trim()) return "Endereço é obrigatório";
    if (!addressNumber.trim()) return "Número é obrigatório";
    if (!postalCode.replace(/\D/g, "")) return "CEP é obrigatório";
    if (!consent) return "Você deve aceitar o termo de responsabilidade";
    return null;
  };

  const buildAddressPayload = (): ConverterAddress => ({
    postal_code: postalCode.replace(/\D/g, ""),
    address: address.trim(),
    address_number: addressNumber.trim(),
    neighborhood: neighborhood.trim() || undefined,
    city: city.trim() || undefined,
    state: state.trim() || undefined,
  });

  const goSuccess = () => {
    const base = tenantSlug ? `/${tenantSlug}` : "";
    navigate(`${base}/converter/${token}/sucesso`, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setSubmitError(v);
      return;
    }
    setSubmitError(null);

    if (amountCents > 0) {
      // Carry state to payment screen — pix will be generated lazily there.
      const base = tenantSlug ? `/${tenantSlug}` : "";
      navigate(`${base}/converter/${token}/pagamento`, {
        state: {
          token,
          password,
          address: buildAddressPayload(),
          amount_cents: amountCents,
          pending_conversion_id: conversion.id,
          student_name: conversion.drop_in_student?.full_name,
          tenant_slug: tenantSlug,
        },
      });
      return;
    }

    // Free conversion — call complete-conversion directly
    completeConversion.mutate(
      { token: token!, password, address: buildAddressPayload() },
      {
        onSuccess: () => {
          toast.success("Cadastro concluído!");
          goSuccess();
        },
        onError: (err: Error) => {
          setSubmitError(err.message);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 py-6 space-y-4">
        {/* Header */}
        <div className="hv-card p-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-hv-foam grid place-items-center mb-3">
            <HVIcon name="check" size={28} stroke={2.4} color="hsl(var(--hv-leaf))" />
          </div>
          <div className="hv-eyebrow">BEM-VINDO(A)</div>
          <h1 className="font-display text-[22px] mt-1 leading-tight">{studentName}</h1>
          <p className="text-[13px] text-hv-text-2 mt-2">
            Complete seu cadastro para virar aluno mensalista do <strong>{tenantName}</strong>.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 text-left">
            <div className="bg-hv-bg rounded-[12px] p-3">
              <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider">PLANO</div>
              <div className="font-bold text-sm mt-0.5">{conversion.plan?.name ?? "—"}</div>
            </div>
            <div className="bg-hv-bg rounded-[12px] p-3">
              <div className="hv-mono text-[10px] text-hv-text-3 tracking-wider">VALOR</div>
              {hasDiscount ? (
                <>
                  <div className="text-[11px] text-hv-text-3 line-through leading-tight mt-0.5">
                    {formatBRL(planTotal)}
                  </div>
                  <div className="font-bold text-sm">{formatBRL(amountCents)}</div>
                </>
              ) : (
                <div className="font-bold text-sm mt-0.5">
                  {amountCents > 0 ? formatBRL(amountCents) : "Grátis"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="hv-card p-5 space-y-4">
          <Section title="Crie sua senha" icon="pin">
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirme a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Section>

          <Section title="Endereço" icon="compass">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="CEP"
                value={postalCode}
                onChange={(e) => handleCepChange(e.target.value)}
                maxLength={9}
              />
              <Input
                placeholder="Número"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
              />
            </div>
            <Input
              placeholder="Endereço (rua, avenida)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <Input
              placeholder="UF"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              maxLength={2}
            />
            {cep.error && <div className="text-[11px] text-hv-coral">{cep.error}</div>}
          </Section>

          {contractText && (
            <Section title="Termo de responsabilidade" icon="paddle">
              <div className="max-h-[180px] overflow-y-auto rounded-[12px] border border-hv-line bg-hv-surface p-3 text-[12px] text-hv-text-2 whitespace-pre-wrap">
                {contractText}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer rounded-[12px] border border-hv-line p-3 bg-hv-surface">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[12px] text-hv-text-2">
                  Li e aceito o termo de responsabilidade.
                </span>
              </label>
            </Section>
          )}
          {!contractText && (
            <label className="flex items-start gap-2.5 cursor-pointer rounded-[12px] border border-hv-line p-3 bg-hv-surface">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-[12px] text-hv-text-2">
                Confirmo os dados acima e autorizo o cadastro.
              </span>
            </label>
          )}

          {submitError && (
            <div className="text-[12px] text-hv-coral text-center">{submitError}</div>
          )}

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={completeConversion.isPending}
          >
            {completeConversion.isPending
              ? "Processando…"
              : amountCents > 0
                ? `Continuar para pagamento (${formatBRL(amountCents)})`
                : "Finalizar cadastro"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: Parameters<typeof HVIcon>[0]["name"];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <HVIcon name={icon} size={16} color="hsl(var(--hv-navy))" />
        <div className="font-semibold text-sm">{title}</div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
  cta,
}: {
  icon: Parameters<typeof HVIcon>[0]["name"];
  title: string;
  message: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="hv-card p-6 text-center max-w-sm w-full">
        <div className="mx-auto w-14 h-14 rounded-full bg-hv-foam grid place-items-center mb-3">
          <HVIcon name={icon} size={28} stroke={2.4} color="hsl(var(--hv-navy))" />
        </div>
        <div className="font-display text-[18px]">{title}</div>
        <div className="text-sm text-hv-text-2 mt-2">{message}</div>
        {cta && (
          <Button onClick={cta.onClick} variant="primary" size="default" className="mt-4 w-full">
            {cta.label}
          </Button>
        )}
      </div>
    </div>
  );
}
