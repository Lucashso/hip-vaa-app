// useCepLookup — busca endereço por CEP via ViaCEP.

import { useCallback, useState } from "react";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  cityCode: string;
}

/** Formata CEP como 99999-999. */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function useCepLookup() {
  const [result, setResult] = useState<CepResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const searchCep = useCallback(async (cep: string): Promise<CepResult | null> => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setError("CEP deve ter 8 dígitos");
      return null;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!response.ok) throw new Error("Erro ao buscar CEP");

      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) {
        setError("CEP não encontrado");
        return null;
      }

      const cepResult: CepResult = {
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade,
        state: data.uf,
        cep: data.cep,
        cityCode: data.ibge || "",
      };
      setResult(cepResult);
      return cepResult;
    } catch {
      setError("Erro ao buscar CEP. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, error, isLoading, searchCep, reset };
}
