// ConsentDialog — termo LGPD + assinatura digital + chamada edge generate-consent-pdf.

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
}

export function ConsentDialog({ open, onClose, studentId }: Props) {
  const { data: tenant } = useTenant();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contractText =
    tenant?.contract_text ||
    "Eu, aluno(a) acima identificado, declaro estar ciente dos riscos inerentes à prática esportiva e isento(a) a escola/filial de qualquer responsabilidade por eventos não relacionados à infraestrutura ou orientação técnica. Autorizo o uso de minha imagem para divulgação institucional e concordo com os Termos de Uso e a Política de Privacidade da plataforma (LGPD).";

  async function handleAccept() {
    if (!agreed || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-consent-pdf",
        { body: { student_id: studentId } },
      );
      if (error) {
        // Fallback: marca o consent sem PDF se a edge falhar.
        console.warn("generate-consent-pdf falhou, marcando consent localmente", error);
        const { error: updErr } = await supabase
          .from("students")
          .update({
            consent_signed: true,
            consent_signed_at: new Date().toISOString(),
          })
          .eq("id", studentId);
        if (updErr) throw updErr;
      } else {
        // Edge function gerou PDF — já gravou no banco normalmente.
        console.log("consent PDF gerado", data);
      }
      qc.invalidateQueries({ queryKey: ["my-student"] });
      toast.success("Termo assinado com sucesso!");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Erro ao assinar termo: " + msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Termo de adesão"
      subtitle="LGPD · ISENÇÃO DE RESPONSABILIDADE"
      maxWidth={520}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Depois
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={!agreed || submitting}
          >
            {submitting ? "Assinando…" : "Aceito e assino"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="hv-card p-4 max-h-[40vh] overflow-auto">
          <p className="text-[13px] leading-relaxed text-hv-text-2 whitespace-pre-wrap">
            {contractText}
          </p>
        </div>

        <div className="text-[12px] text-hv-text-3">
          Assinado eletronicamente por{" "}
          <span className="font-semibold text-hv-text">
            {profile?.full_name || "—"}
          </span>{" "}
          em {new Date().toLocaleString("pt-BR")}.
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-[13px] text-hv-text-2 leading-snug">
            Li, compreendi e concordo com o termo acima.
          </span>
        </label>
      </div>
    </Modal>
  );
}
