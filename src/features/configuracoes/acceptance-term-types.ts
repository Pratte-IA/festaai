export interface TenantAcceptanceTerm {
  active: boolean;
  appearsInContract: boolean;
  content: string;
  createdAt: string;
  id: string;
  isRequired: boolean;
  isSystem: boolean;
  showAtSigning: boolean;
  showInForm: boolean;
  sortOrder: number;
  termKey: string | null;
  title: string;
  updatedAt: string;
}

export type TenantAcceptanceTermInput = Omit<
  TenantAcceptanceTerm,
  "createdAt" | "id" | "isSystem" | "termKey" | "updatedAt"
>;

/** Aceites padrão seedados */
export const SEEDED_ACCEPTANCE_TERM_KEYS = [
  "termos_contratacao",
  "informacoes_verdadeiras",
  "uso_imagem",
] as const;

/** Termos legados — mantidos no banco, inativos por padrão após migração */
export const LEGACY_ACCEPTANCE_TERM_KEYS = [
  "politica_cancelamento",
  "politica_remarcacao",
  "regras_espaco",
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

export const isFormPhaseTerm = (
  term: Pick<TenantAcceptanceTerm, "active" | "showInForm">,
) => term.active && term.showInForm;

export const isSigningPhaseTerm = (
  term: Pick<TenantAcceptanceTerm, "active" | "showAtSigning">,
) => term.active && term.showAtSigning;

export const defaultAcceptanceTermInput = (): TenantAcceptanceTermInput => ({
  active: true,
  appearsInContract: true,
  content: "",
  isRequired: true,
  showAtSigning: false,
  showInForm: true,
  sortOrder: 0,
  title: "",
});

export const formatAcceptanceTermDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
