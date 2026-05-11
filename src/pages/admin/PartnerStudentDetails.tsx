// PartnerStudentDetails — ficha do aluno parceiro (Wellhub/etc).

import { useParams } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { HVIcon } from "@/lib/HVIcon";
import { Loader } from "@/components/Loader";
import { usePartnerStudentDetails } from "@/hooks/usePartnerStudents";
import { getInitial } from "@/lib/utils";

export default function PartnerStudentDetails() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePartnerStudentDetails(id);

  if (isLoading) return <Loader />;
  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader title="Aluno parceiro" sub="NÃO ENCONTRADO" back />
        <div className="max-w-md mx-auto px-4 py-8 text-center text-hv-text-3">
          Aluno parceiro não encontrado.
        </div>
      </div>
    );
  }

  const { student, checkins } = data;

  return (
    <div className="min-h-screen bg-background pb-12">
      <AdminHeader title={student.full_name ?? "Aluno parceiro"} sub={(student.provider ?? "PARCEIRO").toUpperCase()} back />
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="hv-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-hv-foam text-hv-navy grid place-items-center font-display font-bold text-lg">
              {getInitial(student.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16px] font-bold truncate">{student.full_name}</div>
              <div className="text-[11px] text-hv-text-3">{student.email ?? student.document ?? "—"}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <div><span className="text-hv-text-3">Provider:</span> {student.provider ?? "—"}</div>
            <div><span className="text-hv-text-3">Plano:</span> {student.plan_name ?? "—"}</div>
            <div><span className="text-hv-text-3">Telefone:</span> {student.phone ?? "—"}</div>
            <div><span className="text-hv-text-3">Status:</span> {student.status ?? "—"}</div>
            <div className="col-span-2"><span className="text-hv-text-3">Total check-ins:</span> {student.total_checkins ?? 0}</div>
            <div className="col-span-2"><span className="text-hv-text-3">Primeiro:</span> {student.first_checkin_at ? new Date(student.first_checkin_at).toLocaleDateString("pt-BR") : "—"}</div>
            <div className="col-span-2"><span className="text-hv-text-3">Último:</span> {student.last_checkin_at ? new Date(student.last_checkin_at).toLocaleDateString("pt-BR") : "—"}</div>
          </div>
        </div>

        <div>
          <h3 className="hv-eyebrow mb-2">Histórico de check-ins ({checkins.length})</h3>
          {checkins.length === 0 ? (
            <div className="hv-card p-4 text-center text-[13px] text-hv-text-3">Sem check-ins registrados.</div>
          ) : (
            <div className="hv-card divide-y divide-hv-line">
              {checkins.map((c) => (
                <div key={c.id} className="p-3 flex items-center gap-3">
                  <HVIcon name="check" size={16} color="hsl(var(--hv-leaf))" />
                  <div className="flex-1 text-[12px]">
                    <div>{new Date(c.checked_in_at).toLocaleString("pt-BR")}</div>
                    {c.metadata_json && typeof c.metadata_json === "object" && (
                      <div className="text-[10px] text-hv-text-3 font-mono">
                        {Object.entries(c.metadata_json).slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
