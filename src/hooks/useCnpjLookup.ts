// useCnpjLookup — busca dados de empresa via BrasilAPI com debounce.

import { useCallback, useEffect, useRef, useState } from "react";

interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  email: string | null;
  ddd_telefone_1: string | null;
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cep: string | number;
  municipio: string;
  uf: string;
}

export interface CnpjResult {
  razao_social: string;
  nome_fantasia: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
}

interface UseCnpjLookupReturn {
  result: CnpjResult | null;
  error: string | null;
  isLoading: boolean;
  searchCnpj: (cnpj: string) => Promise<CnpjResult | null>;
  reset: () => void;
}

const DEBOUNCE_MS = 800;

export function useCnpjLookup(): UseCnpjLookupReturn {
  const [result, setResult] = useState<CnpjResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const fetchCnpj = useCallback(async (digits: string): Promise<CnpjResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!response.ok) {
        if (response.status === 404) setError("CNPJ não encontrado");
        else setError("Erro ao consultar CNPJ");
        return null;
      }
      const data = (await response.json()) as BrasilApiCnpjResponse;
      const logradouro = [data.descricao_tipo_de_logradouro, data.logradouro]
        .filter(Boolean)
        .join(" ");
      const cnpjResult: CnpjResult = {
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || null,
        cep: data.cep ? String(data.cep).replace(/\D/g, "") : "",
        logradouro,
        numero: data.numero || "",
        bairro: data.bairro || "",
        municipio: data.municipio || "",
        uf: data.uf || "",
      };
      setResult(cnpjResult);
      return cnpjResult;
    } catch {
      setError("Erro ao consultar CNPJ. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchCnpj = useCallback(
    (cnpj: string): Promise<CnpjResult | null> => {
      const digits = cnpj.replace(/\D/g, "");
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (digits.length !== 14) {
        setError(digits.length === 0 ? null : "CNPJ deve ter 14 dígitos");
        return Promise.resolve(null);
      }
      return new Promise((resolve) => {
        timerRef.current = window.setTimeout(async () => {
          const res = await fetchCnpj(digits);
          resolve(res);
        }, DEBOUNCE_MS);
      });
    },
    [fetchCnpj],
  );

  const reset = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { result, error, isLoading, searchCnpj, reset };
}
