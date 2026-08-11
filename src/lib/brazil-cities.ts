export interface BrazilMunicipality {
  codigoIbge: string;
  nome: string;
}

interface BrasilApiMunicipality {
  codigo_ibge?: string;
  nome?: string;
}

const SMALL_WORDS = new Set(["da", "das", "de", "do", "dos", "e"]);

/** Normaliza para comparação sem acento/caixa. */
export const normalizeCitySearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");

/** Converte nome da API (muitas vezes em CAIXA ALTA) para Title Case pt-BR. */
export const formatCityName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "";

  return trimmed
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      if (!word) return word;
      return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1);
    })
    .join(" ");
};

export const fetchMunicipalitiesByUf = async (uf: string): Promise<BrazilMunicipality[]> => {
  const sigla = uf.trim().toUpperCase();
  if (sigla.length !== 2) return [];

  const response = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${sigla}`);
  if (!response.ok) {
    throw new Error(`Não foi possível carregar cidades de ${sigla}.`);
  }

  const data = (await response.json()) as BrasilApiMunicipality[];
  if (!Array.isArray(data)) {
    throw new Error("Resposta inválida ao carregar cidades.");
  }

  const municipalities = data
    .map((item) => {
      const nome = typeof item.nome === "string" ? formatCityName(item.nome) : "";
      const codigoIbge = typeof item.codigo_ibge === "string" ? item.codigo_ibge : "";
      if (!nome || !codigoIbge) return null;
      return { codigoIbge, nome };
    })
    .filter((item): item is BrazilMunicipality => item !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return municipalities;
};

export const findBrazilCity = (
  value: string,
  cities: readonly BrazilMunicipality[],
): BrazilMunicipality | null => {
  const needle = normalizeCitySearch(value);
  if (!needle) return null;
  return cities.find((city) => normalizeCitySearch(city.nome) === needle) ?? null;
};

export const isValidBrazilCity = (
  value: string,
  cities: readonly BrazilMunicipality[],
): boolean => Boolean(findBrazilCity(value, cities));
