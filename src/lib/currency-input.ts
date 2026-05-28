/** Converte reais para centavos inteiros (evita imprecisão de float). */
export const reaisToCents = (reais: number): number => Math.round(reais * 100);

export const centsToReais = (cents: number): number => cents / 100;

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatCentsAsBrl = (cents: number): string => brlFormatter.format(centsToReais(cents));

/** Extrai centavos a partir dos dígitos digitados (estilo caixa/máquina de cartão). */
export const digitsToCents = (raw: string): number => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
};

export const formatReaisAsBrl = (reais: number): string => {
  if (!Number.isFinite(reais) || reais <= 0) return "";
  return formatCentsAsBrl(reaisToCents(reais));
};

export const coerceReais = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
