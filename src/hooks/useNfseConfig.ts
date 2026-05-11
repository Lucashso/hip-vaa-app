// useNfseConfig — lê/salva config de NFs-e do tenant via settings_json.nfse.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface NfseConfig {
  cnpj_emitente: string;
  regime_tributario: string;
  cnae: string;
  aliquota_iss: number | null;
  municipio_codigo: string;
  ambiente: "producao" | "homologacao";
  serie_rps: string;
  numero_rps_inicial: number | null;
}

const DEFAULT_CONFIG: NfseConfig = {
  cnpj_emitente: "",
  regime_tributario: "simples_nacional",
  cnae: "",
  aliquota_iss: null,
  municipio_codigo: "",
  ambiente: "homologacao",
  serie_rps: "1",
  numero_rps_inicial: 1,
};

export function useNfseConfig(tenantId?: string | null) {
  return useQuery({
    queryKey: ["nfse-config", tenantId],
    queryFn: async (): Promise<NfseConfig> => {
      if (!tenantId) return DEFAULT_CONFIG;
      const { data, error } = await supabase
        .from("tenants")
        .select("settings_json")
        .eq("id", tenantId)
        .maybeSingle();
      if (error) throw error;
      const settings = (data?.settings_json ?? {}) as Record<string, unknown>;
      const nfse = (settings.nfse ?? {}) as Partial<NfseConfig>;
      return { ...DEFAULT_CONFIG, ...nfse };
    },
    enabled: !!tenantId,
  });
}

export function useSaveNfseConfig(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: NfseConfig) => {
      if (!tenantId) throw new Error("Tenant não identificado");

      // Fetch current settings_json
      const { data: curr } = await supabase
        .from("tenants")
        .select("settings_json")
        .eq("id", tenantId)
        .maybeSingle();
      const currentSettings = ((curr?.settings_json ?? {}) as Record<string, unknown>);
      const newSettings = { ...currentSettings, nfse: config };

      const { error } = await supabase
        .from("tenants")
        .update({ settings_json: newSettings })
        .eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nfse-config", tenantId] });
      qc.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Configuração NFs-e salva!");
    },
    onError: (err: Error) => toast.error("Erro ao salvar: " + err.message),
  });
}

export function useTestNfseConnection() {
  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { data, error } = await supabase.functions.invoke("test-nfse-connection", {
        body: { tenant_id: tenantId },
      });
      if (error) throw error;
      return data as { success: boolean; message: string };
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success("Conexão NFs-e OK: " + (data.message || "Serviço respondeu"));
      } else {
        toast.error("Falha na conexão: " + (data?.message || "Erro desconhecido"));
      }
    },
    onError: (err: Error) => toast.error("Erro ao testar: " + err.message),
  });
}

export function useEmitNfse() {
  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { data, error } = await supabase.functions.invoke("emit-nfse", {
        body: { tenant_id: tenantId, test: true },
      });
      if (error) throw error;
      return data as { success: boolean; number?: string; message?: string };
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(`NFs-e teste emitida${data.number ? ` · Nº ${data.number}` : ""}!`);
      } else {
        toast.error("Falha na emissão: " + (data?.message || "Erro desconhecido"));
      }
    },
    onError: (err: Error) => toast.error("Erro ao emitir: " + err.message),
  });
}
