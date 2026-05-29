export interface TenantAcceptanceTerm {
  active: boolean;
  appearsInContract: boolean;
  content: string;
  createdAt: string;
  id: string;
  isRequired: boolean;
  isSystem: boolean;
  sortOrder: number;
  termKey: string | null;
  title: string;
  updatedAt: string;
}

export type TenantAcceptanceTermInput = Omit<
  TenantAcceptanceTerm,
  "createdAt" | "id" | "isSystem" | "termKey" | "updatedAt"
>;

/** Aceites padrão seedados na migration da Fase A */
export const SEEDED_ACCEPTANCE_TERM_KEYS = [
  "termos_contratacao",
  "informacoes_verdadeiras",
  "politica_cancelamento",
  "politica_remarcacao",
  "regras_espaco",
  "uso_imagem",
  "horarios_contratados",
  "itens_inclusos",
] as const;

export type SeededAcceptanceTermKey = (typeof SEEDED_ACCEPTANCE_TERM_KEYS)[number];

/** Termos essenciais — não podem ser inativados nem excluídos */
export const LOCKED_SYSTEM_TERM_KEYS: SeededAcceptanceTermKey[] = [
  "termos_contratacao",
  "informacoes_verdadeiras",
];

export const isLockedSystemTerm = (term: Pick<TenantAcceptanceTerm, "isSystem" | "termKey">) =>
  term.isSystem &&
  term.termKey != null &&
  LOCKED_SYSTEM_TERM_KEYS.includes(term.termKey as SeededAcceptanceTermKey);

export const defaultAcceptanceTermInput = (): TenantAcceptanceTermInput => ({
  active: true,
  appearsInContract: true,
  content: "",
  isRequired: true,
  sortOrder: 0,
  title: "",
});

export const formatAcceptanceTermDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
