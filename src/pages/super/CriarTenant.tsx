// SuperAdmin · Criar nova filial — fiel ao super-extras2.jsx HVSuperCriarTenant.
// Wizard 3 passos (form + preview + checklist).

import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperShell } from "@/components/SuperShell";
import { HVIcon } from "@/lib/HVIcon";

interface FormState {
  name: string;
  slug: string;
  document: string;
  address: string;
  responsible_name: string;
  responsible_email: string;
  responsible_phone: string;
  responsible_cpf: string;
}

const INITIAL: FormState = {
  name: "",
  slug: "",
  document: "",
  address: "",
  responsible_name: "",
  responsible_email: "",
  responsible_phone: "",
  responsible_cpf: "",
};

const STEPS = [
  { n: 1, l: "Dados da filial" },
  { n: 2, l: "Plano & pagamento" },
  { n: 3, l: "Confirmação" },
];

export default function SuperCriarTenant() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);

  const update = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const previewName = form.name || "Nova filial";
  const previewSlug = form.slug || "hipvaa.app/nova";

  const checklist = [
    { l: "Dados validados", on: !!form.name && !!form.slug },
    { l: "CNPJ ativo na Receita", on: !!form.document && form.document.length > 14 },
    { l: "Plano contratado", on: step >= 2 },
    { l: "Contrato assinado", on: step >= 3 },
    { l: "Setup inicial", on: false },
  ];

  const formFields: { l: string; k: keyof FormState; help: string }[] = [
    { l: "Nome da filial", k: "name", help: "como aparece para os alunos" },
    { l: "Slug (URL)", k: "slug", help: "url pública do app" },
    { l: "CNPJ", k: "document", help: "razão social auto preenchida via Receita" },
    { l: "Endereço", k: "address", help: "" },
  ];
  const responsibleFields: { l: string; k: keyof FormState }[] = [
    { l: "Nome", k: "responsible_name" },
    { l: "E-mail", k: "responsible_email" },
    { l: "Telefone", k: "responsible_phone" },
    { l: "CPF", k: "responsible_cpf" },
  ];

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
            {step === 1
              ? "DADOS DA FILIAL"
              : step === 2
                ? "PLANO & PAGAMENTO"
                : "CONFIRMAÇÃO"}
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
              ? "Identificação & responsável"
              : step === 2
                ? "Escolha o plano"
                : "Revisar e criar"}
          </h3>

          {step === 1 && (
            <>
              {formFields.map((f) => (
                <div key={f.k} style={{ marginBottom: 14 }}>
                  <label
                    className="hv-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "hsl(var(--hv-text-2))",
                      letterSpacing: 1.2,
                    }}
                  >
                    {f.l}
                  </label>
                  <input
                    value={form[f.k]}
                    onChange={(e) => update(f.k, e.target.value)}
                    style={{
                      marginTop: 6,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1.5px solid hsl(var(--hv-line))",
                      background: "white",
                      fontSize: 13,
                      fontWeight: 500,
                      width: "100%",
                      outline: "none",
                      display: "block",
                    }}
                  />
                  {f.help && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "hsl(var(--hv-text-3))",
                        marginTop: 4,
                      }}
                    >
                      {f.help}
                    </div>
                  )}
                </div>
              ))}

              <div
                className="hv-mono"
                style={{
                  fontSize: 10,
                  color: "hsl(var(--hv-text-3))",
                  letterSpacing: 1.2,
                  fontWeight: 700,
                  marginTop: 18,
                  marginBottom: 8,
                }}
              >
                RESPONSÁVEL (FRANQUEADO)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {responsibleFields.map((f) => (
                  <div key={f.k}>
                    <label
                      className="hv-mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "hsl(var(--hv-text-2))",
                        letterSpacing: 1.2,
                      }}
                    >
                      {f.l}
                    </label>
                    <input
                      value={form[f.k]}
                      onChange={(e) => update(f.k, e.target.value)}
                      style={{
                        marginTop: 6,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1.5px solid hsl(var(--hv-line))",
                        background: "white",
                        fontSize: 13,
                        width: "100%",
                        outline: "none",
                        display: "block",
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ fontSize: 13, color: "hsl(var(--hv-text-2))", lineHeight: 1.6 }}>
              Configure o plano da nova filial. Após selecionar e configurar pagamento, a
              filial entra em trial de 14 dias.
            </div>
          )}

          {step === 3 && (
            <div style={{ fontSize: 13, color: "hsl(var(--hv-text-2))", lineHeight: 1.6 }}>
              Revise os dados antes de criar a filial. O contrato será enviado para
              assinatura digital do franqueado.
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
                style={{
                  padding: "11px 18px",
                  borderRadius: 10,
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "hsl(var(--hv-text))",
                }}
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => navigate("/rede")}
              style={{
                padding: "11px 18px",
                borderRadius: 10,
                background: "hsl(var(--hv-bg))",
                border: "1px solid hsl(var(--hv-line))",
                fontSize: 13,
                fontWeight: 600,
                color: "hsl(var(--hv-text))",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (step < 3) setStep(step + 1);
                else navigate("/rede");
              }}
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
              }}
            >
              {step < 3 ? "Continuar" : "Criar filial"}
              <HVIcon name="arrow-right" size={14} stroke={2.4} />
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
            <div
              className="hv-mono"
              style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1.2 }}
            >
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
