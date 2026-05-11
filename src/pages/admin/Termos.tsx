// Admin · Termos de uso — editor de contract_text e drop_in_contract_text.

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Loader } from "@/components/Loader";
import { useTenant, useUpdateTenantContracts } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

type Tab = "mensalistas" | "avulsos";

export default function AdminTermos() {
  const { data: tenant, isLoading } = useTenant();
  const updateContracts = useUpdateTenantContracts();
  const [tab, setTab] = useState<Tab>("mensalistas");
  const [contract, setContract] = useState("");
  const [dropIn, setDropIn] = useState("");

  useEffect(() => {
    if (tenant) {
      setContract(tenant.contract_text || "");
      setDropIn(tenant.drop_in_contract_text || "");
    }
  }, [tenant]);

  const onSave = () => {
    if (tab === "mensalistas") {
      updateContracts.mutate({ contract_text: contract });
    } else {
      updateContracts.mutate({ drop_in_contract_text: dropIn });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader title="Termos de uso" sub="MENSALISTAS · AVULSOS" />
      <div className="flex gap-4 px-4 pt-2.5 pb-1.5 bg-hv-surface border-b border-hv-line">
        {(["mensalistas", "avulsos"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "py-1.5 text-[13px] capitalize bg-transparent border-0",
              tab === t ? "font-bold text-hv-navy" : "font-medium text-hv-text-3",
            )}
            style={{
              borderBottom:
                tab === t ? "2px solid hsl(var(--hv-navy))" : "2px solid transparent",
            }}
          >
            {t === "mensalistas" ? "Mensalistas" : "Avulsos"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto pb-32 pt-3 px-4">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <div className="hv-card p-3.5">
              <div
                className="hv-mono text-[10px] text-hv-text-3 font-bold mb-2"
                style={{ letterSpacing: "0.12em" }}
              >
                {tab === "mensalistas"
                  ? "CONTRATO DE MENSALISTA"
                  : "CONTRATO AULA AVULSA"}
              </div>
              <textarea
                value={tab === "mensalistas" ? contract : dropIn}
                onChange={(e) =>
                  tab === "mensalistas"
                    ? setContract(e.target.value)
                    : setDropIn(e.target.value)
                }
                rows={18}
                placeholder={`Texto do contrato para ${tab === "mensalistas" ? "alunos mensalistas" : "alunos avulsos"}...`}
                className="w-full p-3 rounded-[10px] text-[12px] text-hv-text font-mono"
                style={{
                  background: "hsl(var(--hv-bg))",
                  border: "1px solid hsl(var(--hv-line))",
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
              <div className="text-[11px] text-hv-text-3 mt-2">
                Quebras de linha são preservadas.{" "}
                {tab === "mensalistas"
                  ? `${contract.length}`
                  : `${dropIn.length}`}{" "}
                caracteres
              </div>
            </div>
          </>
        )}
      </div>
      <div
        className="px-4 py-3 bg-hv-surface"
        style={{ borderTop: "1px solid hsl(var(--hv-line))" }}
      >
        <button
          type="button"
          onClick={onSave}
          disabled={updateContracts.isPending || isLoading}
          className="w-full py-3.5 rounded-[14px] text-white font-bold text-[14px] border-0"
          style={{
            background: "hsl(var(--hv-navy))",
            opacity: updateContracts.isPending ? 0.6 : 1,
          }}
        >
          {updateContracts.isPending
            ? "Salvando..."
            : `Salvar termos · ${tab === "mensalistas" ? "Mensalistas" : "Avulsos"}`}
        </button>
      </div>
    </div>
  );
}
