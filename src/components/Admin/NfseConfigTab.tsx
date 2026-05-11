// NfseConfigTab — formulário de configuração de NFs-e para a aba de Configurações do admin.
// Campos: cnpj_emitente, regime_tributario, cnae, alíquota, município, ambiente, série RPS.
// Botões: Salvar, Testar conexão, Emitir NFs-e teste.

import { useState, useEffect } from "react";
import { HVIcon } from "@/lib/HVIcon";
import { FieldText, FieldNumber, FieldSelect } from "@/components/Field";
import {
  useNfseConfig,
  useSaveNfseConfig,
  useTestNfseConnection,
  useEmitNfse,
  type NfseConfig,
} from "@/hooks/useNfseConfig";

const REGIME_OPTIONS = [
  { value: "simples_nacional", label: "Simples Nacional" },
  { value: "lucro_presumido", label: "Lucro Presumido" },
  { value: "lucro_real", label: "Lucro Real" },
  { value: "mei", label: "MEI" },
];

const AMBIENTE_OPTIONS = [
  { value: "homologacao", label: "Homologação (teste)" },
  { value: "producao", label: "Produção" },
];

interface Props {
  tenantId?: string | null;
}

function maskCnpj(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function NfseConfigTab({ tenantId }: Props) {
  const { data: config } = useNfseConfig(tenantId);
  const save = useSaveNfseConfig(tenantId);
  const testConn = useTestNfseConnection();
  const emitTest = useEmitNfse();

  const [cnpj, setCnpj] = useState("");
  const [regime, setRegime] = useState<NfseConfig["regime_tributario"]>("simples_nacional");
  const [cnae, setCnae] = useState("");
  const [aliquota, setAliquota] = useState<number | null>(null);
  const [municipio, setMunicipio] = useState("");
  const [ambiente, setAmbiente] = useState<NfseConfig["ambiente"]>("homologacao");
  const [serieRps, setSerieRps] = useState("1");
  const [numRps, setNumRps] = useState<number | null>(1);

  useEffect(() => {
    if (config) {
      setCnpj(config.cnpj_emitente || "");
      setRegime(config.regime_tributario || "simples_nacional");
      setCnae(config.cnae || "");
      setAliquota(config.aliquota_iss ?? null);
      setMunicipio(config.municipio_codigo || "");
      setAmbiente(config.ambiente || "homologacao");
      setSerieRps(config.serie_rps || "1");
      setNumRps(config.numero_rps_inicial ?? 1);
    }
  }, [config]);

  function handleSave() {
    save.mutate({
      cnpj_emitente: cnpj.replace(/\D/g, ""),
      regime_tributario: regime,
      cnae: cnae.replace(/\D/g, ""),
      aliquota_iss: aliquota,
      municipio_codigo: municipio,
      ambiente,
      serie_rps: serieRps,
      numero_rps_inicial: numRps,
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-[8px] grid place-items-center"
          style={{ background: "hsl(var(--hv-amber) / 0.18)" }}
        >
          <HVIcon name="wallet" size={16} color="hsl(var(--hv-amber))" />
        </div>
        <div>
          <div className="text-[13px] font-bold">NFs-e · Nota Fiscal de Serviços Eletrônica</div>
          <div className="text-[11px] text-hv-text-3">Prefeitura municipal · Emissão automatizada</div>
        </div>
        <div className="ml-auto">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: ambiente === "homologacao" ? "hsl(var(--hv-amber) / 0.18)" : "hsl(var(--hv-leaf) / 0.15)",
              color: ambiente === "homologacao" ? "hsl(var(--hv-amber))" : "hsl(var(--hv-leaf))",
            }}
          >
            {ambiente === "homologacao" ? "Homologação" : "Produção"}
          </span>
        </div>
      </div>

      <div className="hv-card p-4 space-y-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {/* CNPJ */}
          <FieldText
            label="CNPJ do emitente"
            value={cnpj}
            onChange={(v) => setCnpj(maskCnpj(v))}
            placeholder="00.000.000/0001-00"
            required
          />

          {/* Regime tributário */}
          <FieldSelect
            label="Regime tributário"
            value={regime as string}
            onChange={(v) => setRegime(v as NfseConfig["regime_tributario"])}
            options={REGIME_OPTIONS}
            required
          />

          {/* CNAE */}
          <FieldText
            label="CNAE principal"
            value={cnae}
            onChange={setCnae}
            placeholder="ex: 9319-1/01"
          />

          {/* Alíquota ISS */}
          <FieldNumber
            label="Alíquota ISS (%)"
            value={aliquota}
            onChange={setAliquota}
            min={0}
            max={5}
            step={0.01}
            placeholder="ex: 2.00"
          />

          {/* Código município */}
          <FieldText
            label="Código do município (IBGE)"
            value={municipio}
            onChange={setMunicipio}
            placeholder="ex: 3550308 (São Paulo)"
          />

          {/* Ambiente */}
          <FieldSelect
            label="Ambiente"
            value={ambiente}
            onChange={(v) => setAmbiente(v as NfseConfig["ambiente"])}
            options={AMBIENTE_OPTIONS}
            required
          />

          {/* Série RPS */}
          <FieldText
            label="Série RPS"
            value={serieRps}
            onChange={setSerieRps}
            placeholder="1"
          />

          {/* Número RPS inicial */}
          <FieldNumber
            label="Número RPS inicial"
            value={numRps}
            onChange={setNumRps}
            min={1}
            step={1}
            placeholder="1"
          />
        </div>
      </div>

      {/* Certificado — placeholder (upload futuro) */}
      <div
        className="hv-card p-3.5 flex items-center gap-3"
        style={{ border: "1.5px dashed hsl(var(--hv-line))" }}
      >
        <div
          className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
          style={{ background: "hsl(var(--hv-bg))" }}
        >
          <HVIcon name="share" size={18} color="hsl(var(--hv-text-3))" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold">Certificado digital (A1)</div>
          <div className="text-[11px] text-hv-text-3">
            Upload do .pfx + senha — disponível em breve
          </div>
        </div>
        <button
          type="button"
          disabled
          className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold border-0 opacity-40"
          style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
        >
          Upload
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => tenantId && testConn.mutate(tenantId)}
          disabled={!tenantId || testConn.isPending}
          className="flex-1 py-2.5 rounded-[12px] text-[12px] font-bold border-0 flex items-center justify-center gap-2"
          style={{
            background: "hsl(var(--hv-bg))",
            border: "1px solid hsl(var(--hv-line))",
            color: "hsl(var(--hv-text))",
            opacity: testConn.isPending ? 0.6 : 1,
          }}
        >
          <HVIcon name="zap" size={14} />
          {testConn.isPending ? "Testando…" : "Testar conexão"}
        </button>

        <button
          type="button"
          onClick={() => tenantId && emitTest.mutate(tenantId)}
          disabled={!tenantId || emitTest.isPending}
          className="flex-1 py-2.5 rounded-[12px] text-[12px] font-bold border-0 flex items-center justify-center gap-2"
          style={{
            background: "hsl(var(--hv-amber) / 0.15)",
            color: "hsl(var(--hv-amber))",
            opacity: emitTest.isPending ? 0.6 : 1,
          }}
        >
          <HVIcon name="share" size={14} />
          {emitTest.isPending ? "Emitindo…" : "Emitir NFs-e teste"}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={save.isPending}
          className="flex-1 py-2.5 rounded-[12px] text-[12px] font-bold text-white border-0 flex items-center justify-center gap-2"
          style={{
            background: "hsl(var(--hv-navy))",
            opacity: save.isPending ? 0.6 : 1,
          }}
        >
          <HVIcon name="check" size={14} />
          {save.isPending ? "Salvando…" : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}
