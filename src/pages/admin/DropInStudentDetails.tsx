// DropInStudentDetails — ficha do aluno avulso (admin).

import { useParams } from "react-router-dom";
import { useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { FieldText, FieldSelect } from "@/components/Field";
import { useDropInStudent, useDropInCheckins, useConvertDropInToStudent } from "@/hooks/useDropInStudents";
import { usePlans } from "@/hooks/usePlans";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { getInitial, formatBRL } from "@/lib/utils";
import { toast } from "sonner";

export default function DropInStudentDetails() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { data: tenant } = useTenant();
  const { data: student, isLoading } = useDropInStudent(id);
  const { data: checkins = [] } = useDropInCheckins(id);
  const { data: plans = [] } = usePlans(profile?.tenant_id ?? tenant?.id);
  const convert = useConvertDropInToStudent();

  const [showConvert, setShowConvert] = useState(false);
  const [planId, setPlanId] = useState("");
  const [convertEmail, setConvertEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);

  if (isLoading) return <Loader />;
  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader title="Aluno avulso" sub="NÃO ENCONTRADO" back />
        <div className="max-w-md mx-auto px-4 py-8 text-center text-hv-text-3">
          Aluno avulso não encontrado.
        </div>
      </div>
    );
  }

  const openConvert = () => {
    setConvertEmail(student.email ?? "");
    if (plans[0]) setPlanId(plans[0].id);
    setShowConvert(true);
  };

  const handleConvert = async () => {
    if (!id || !planId) return;
    try {
      const res = await convert.mutateAsync({ dropInId: id, planId, email: convertEmail });
      const url = `${window.location.origin}/converter/${res.token}`;
      setLink(url);
      setShowConvert(false);
    } catch {
      /* toast já vem do hook */
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <AdminHeader
        title={student.full_name}
        sub={`AVULSO · ${student.cpf ?? ""}`}
        back
        action={
          <Button onClick={openConvert} disabled={!!student.converted_to_student_id}>
            {student.converted_to_student_id ? "Convertido" : "Converter"}
          </Button>
        }
      />
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="hv-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-hv-foam text-hv-navy grid place-items-center font-display font-bold text-lg">
              {getInitial(student.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16px] font-bold truncate">{student.full_name}</div>
              <div className="text-[11px] text-hv-text-3">{student.email}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <div><span className="text-hv-text-3">Telefone:</span> {student.phone ?? "—"}</div>
            <div><span className="text-hv-text-3">CPF:</span> {student.cpf ?? "—"}</div>
            <div><span className="text-hv-text-3">Nasc:</span> {student.birthdate ?? "—"}</div>
            <div><span className="text-hv-text-3">Sangue:</span> {student.blood_type ?? "—"}</div>
            <div className="col-span-2"><span className="text-hv-text-3">Pode nadar:</span> {student.can_swim ? "Sim" : "Não"}</div>
            <div className="col-span-2"><span className="text-hv-text-3">Pago:</span> {formatBRL((student.amount_paid_cents ?? 0) / 100)}</div>
          </div>
        </div>

        <div>
          <h3 className="hv-eyebrow mb-2">Check-ins ({checkins.length})</h3>
          {checkins.length === 0 ? (
            <div className="hv-card p-4 text-center text-[13px] text-hv-text-3">
              Nenhum check-in registrado.
            </div>
          ) : (
            <div className="hv-card divide-y divide-hv-line">
              {checkins.map((c) => (
                <div key={c.id} className="p-3 flex items-center gap-3">
                  <HVIcon name="check" size={16} color="hsl(var(--hv-leaf))" />
                  <div className="flex-1 text-[12px]">{new Date(c.ts).toLocaleString("pt-BR")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showConvert && (
        <Modal open onClose={() => setShowConvert(false)} title="Converter pra mensalista">
          <p className="text-[13px] text-hv-text-2 mb-3">
            Gera um link de cadastro pro aluno completar a conversão escolhendo o plano selecionado.
          </p>
          <FieldSelect
            label="Plano"
            value={planId}
            onChange={setPlanId}
            options={plans.map((p) => ({ value: p.id, label: `${p.name} — ${formatBRL((p.price_cents ?? 0) / 100)}` }))}
          />
          <FieldText label="E-mail do aluno" value={convertEmail} onChange={setConvertEmail} />
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" onClick={() => setShowConvert(false)}>Cancelar</Button>
            <Button onClick={handleConvert} disabled={!planId || !convertEmail || convert.isPending}>
              {convert.isPending ? "Gerando..." : "Gerar link"}
            </Button>
          </div>
        </Modal>
      )}

      {link && (
        <Modal open onClose={() => setLink(null)} title="Link de conversão">
          <p className="text-[13px] text-hv-text-2 mb-3">
            Envie esse link pro aluno completar o cadastro como mensalista:
          </p>
          <div className="hv-card p-3 break-all font-mono text-[11px]">{link}</div>
          <Button
            className="mt-3 w-full"
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast.success("Link copiado");
            }}
          >
            Copiar
          </Button>
        </Modal>
      )}
    </div>
  );
}
