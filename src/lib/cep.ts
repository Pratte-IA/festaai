import { onlyDigits } from "@/lib/brazil-documents";

export interface CepAddress {
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  rua: string;
}

interface ViaCepResponse {
  bairro?: string;
  cep?: string;
  erro?: boolean;
  localidade?: string;
  logradouro?: string;
  uf?: string;
}

export const fetchAddressByCep = async (cep: string): Promise<CepAddress | null> => {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) return null;

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro || !data.localidade || !data.uf) {
    return null;
  }

  return {
    bairro: data.bairro ?? "",
    cep: digits,
    cidade: data.localidade,
    estado: data.uf,
    rua: data.logradouro ?? "",
  };
};
