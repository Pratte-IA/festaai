export const COMPETENCIA_MONTH_INPUT_MIN = "2000-01";
export const COMPETENCIA_MONTH_INPUT_MAX = "2100-12";

const COMPETENCIA_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const getMonthRange = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  const from = `${monthValue}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${monthValue}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
};

export const getDefaultFinanceiroMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

export const formatFinanceiroMonthLabel = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

/** YYYY-MM com ano entre 2000 e 2100 (bloqueia valores como 0002-08 do input month). */
export const isValidCompetenciaMonth = (value: string): boolean => {
  const match = COMPETENCIA_MONTH_PATTERN.exec(value.trim());
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  return year >= 2000 && year <= 2100;
};

/** Extrai YYYY-MM válido de data ISO (YYYY-MM-DD) ou mês (YYYY-MM). */
export const parseCompetenciaMonth = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const monthValue = value.trim().slice(0, 7);
  return isValidCompetenciaMonth(monthValue) ? monthValue : null;
};
