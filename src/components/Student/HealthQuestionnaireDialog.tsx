// HealthQuestionnaireDialog — formulário dinâmico do questionário de saúde do tenant.
// Lê health_questionnaire_fields do tenant e renderiza um campo por field_type.

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import {
  FieldText,
  FieldNumber,
  FieldSelect,
  FieldToggle,
  FieldTextArea,
} from "@/components/Field";
import { useHealthFields } from "@/hooks/useHealthFields";
import {
  useMyHealthQuestionnaire,
  useSaveHealthQuestionnaire,
} from "@/hooks/useMyHealthQuestionnaire";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
  tenantId: string;
}

type AnswerValue = string | number | boolean | null;

export function HealthQuestionnaireDialog({
  open,
  onClose,
  studentId,
  tenantId,
}: Props) {
  const { data: fields = [], isLoading } = useHealthFields(tenantId);
  const { data: existing } = useMyHealthQuestionnaire(studentId);
  const save = useSaveHealthQuestionnaire();

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [details, setDetails] = useState<Record<string, string>>({});

  // Inicializa com respostas existentes ao abrir
  useEffect(() => {
    if (!open) return;
    if (existing?.custom_responses) {
      const raw = existing.custom_responses as Record<string, unknown>;
      const a: Record<string, AnswerValue> = {};
      const d: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (k.endsWith("__details")) {
          d[k.replace("__details", "")] = String(v ?? "");
        } else if (typeof v === "boolean" || typeof v === "number") {
          a[k] = v;
        } else {
          a[k] = v == null ? null : String(v);
        }
      }
      setAnswers(a);
      setDetails(d);
    } else {
      setAnswers({});
      setDetails({});
    }
  }, [open, existing?.id, existing?.custom_responses]);

  const sections = useMemo(() => {
    const map = new Map<string, typeof fields>();
    for (const f of fields) {
      const key = f.section || "Geral";
      const arr = map.get(key) ?? [];
      arr.push(f);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [fields]);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }
  function setDetailValue(id: string, value: string) {
    setDetails((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSave() {
    // Validação básica: critical = required
    for (const f of fields) {
      if (f.is_critical && (answers[f.id] === undefined || answers[f.id] === null || answers[f.id] === "")) {
        toast.error(`Responda: ${f.label}`);
        return;
      }
    }
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      payload[f.id] = answers[f.id] ?? null;
      if (f.has_details && details[f.id]) {
        payload[`${f.id}__details`] = details[f.id];
      }
    }
    await save.mutateAsync({ studentId, answers: payload });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Questionário de saúde"
      subtitle="OBRIGATÓRIO PRA TREINAR"
      maxWidth={520}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Depois
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={save.isPending || isLoading}
          >
            {save.isPending ? "Salvando…" : "Salvar respostas"}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="py-8 text-center text-sm text-hv-text-2">
          Carregando perguntas…
        </div>
      ) : fields.length === 0 ? (
        <div className="py-8 text-center text-sm text-hv-text-2">
          O questionário ainda não foi configurado pela filial.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map(([section, items]) => (
            <div key={section}>
              <div className="hv-eyebrow mb-2">{section}</div>
              <div className="space-y-1">
                {items.map((f) => {
                  const id = f.id;
                  const value = answers[id];
                  switch (f.field_type) {
                    case "boolean":
                      return (
                        <div key={id} className="border-b border-hv-line pb-2">
                          <FieldToggle
                            label={
                              (f.is_critical ? "• " : "") + f.label
                            }
                            checked={value === true}
                            onChange={(v) => setAnswer(id, v)}
                          />
                          {f.has_details && value === true && (
                            <FieldText
                              label="Descreva"
                              placeholder={f.details_placeholder || ""}
                              value={details[id] ?? ""}
                              onChange={(v) => setDetailValue(id, v)}
                            />
                          )}
                        </div>
                      );
                    case "number":
                      return (
                        <FieldNumber
                          key={id}
                          label={
                            (f.is_critical ? "• " : "") +
                            f.label +
                            (f.unit ? ` (${f.unit})` : "")
                          }
                          value={(value as number) ?? null}
                          onChange={(v) => setAnswer(id, v)}
                          min={f.min_value ?? undefined}
                          max={f.max_value ?? undefined}
                        />
                      );
                    case "select":
                      return (
                        <FieldSelect<string>
                          key={id}
                          label={(f.is_critical ? "• " : "") + f.label}
                          value={(value as string) ?? ""}
                          options={(f.select_options ?? []).map((o) => ({
                            value: o,
                            label: o,
                          }))}
                          onChange={(v) => setAnswer(id, v || null)}
                          required={f.is_critical}
                        />
                      );
                    case "text":
                    default:
                      return (
                        <FieldTextArea
                          key={id}
                          label={(f.is_critical ? "• " : "") + f.label}
                          value={(value as string) ?? ""}
                          onChange={(v) => setAnswer(id, v)}
                          rows={2}
                        />
                      );
                  }
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
