export type ClosingFormSection =
  | "cliente"
  | "aniversariante"
  | "festa"
  | "pacote"
  | "adicionais"
  | "pagamento"
  | "aceites"
  | "contrato";

export type ClosingFormFieldCategory =
  | "contratual"
  | "operacional"
  | "financeiro"
  | "comercial"
  | "experiencia"
  | "interno";

export type ClosingFormFieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "number"
  | "currency"
  | "textarea"
  | "checkbox"
  | "select"
  | "multiselect"
  | "file"
  | "acceptance";

export type EventoClosingFieldKey =
  | "cliente_nome"
  | "cliente_telefone"
  | "cliente_email"
  | "cliente_cpf"
  | "cliente_rg"
  | "cliente_cep"
  | "cliente_rua"
  | "cliente_numero"
  | "cliente_bairro"
  | "cliente_cidade"
  | "cliente_estado"
  | "aniversariante_nome"
  | "aniversariante_data_nascimento"
  | "aniversariante_idade"
  | "aniversariante_tema"
  | "aniversariante_personagem"
  | "data_evento"
  | "hora_evento"
  | "hora_termino"
  | "quantidade_convidados"
  | "quantidade_adultos"
  | "quantidade_crianas"
  | "observacoes_festa"
  | "pacote_nome"
  | "pacote_convidados_inclusos"
  | "valor_pacote"
  | "valor_adicionais"
  | "valor_total"
  | "valor_entrada"
  | "valor_saldo"
  | "forma_pagamento_entrada"
  | "forma_pagamento_saldo"
  | "parcelas"
  | "data_limite_pagamento"
  | "observacoes";

export interface ClosingFormFieldUsage {
  ai: boolean;
  checklist: boolean;
  contract: boolean;
  internalTask: boolean;
  partySummary: boolean;
  reports: boolean;
}

export interface ClosingFormField {
  active: boolean;
  category: ClosingFormFieldCategory;
  config: Record<string, unknown>;
  description: string | null;
  fieldKey: string | null;
  fieldType: ClosingFormFieldType;
  id: string;
  isLocked: boolean;
  isSystem: boolean;
  label: string;
  required: boolean;
  section: ClosingFormSection;
  sortOrder: number;
  usage: ClosingFormFieldUsage;
}

export const closingFormSectionLabels: Record<ClosingFormSection, string> = {
  aceites: "Aceites e regras",
  adicionais: "Adicionais",
  aniversariante: "Aniversariante",
  cliente: "Cliente / Responsável",
  contrato: "Contrato e observações",
  festa: "Dados da festa",
  pacote: "Pacote contratado",
  pagamento: "Pagamento",
};

export const closingFormFieldCategoryLabels: Record<ClosingFormFieldCategory, string> = {
  comercial: "Comercial",
  contratual: "Contratual",
  experiencia: "Experiência do cliente",
  financeiro: "Financeiro",
  interno: "Interno",
  operacional: "Operacional",
};

export const closingFormFieldTypeLabels: Record<ClosingFormFieldType, string> = {
  acceptance: "Aceite",
  checkbox: "Sim/Não",
  currency: "Valor (R$)",
  date: "Data",
  email: "E-mail",
  file: "Upload de arquivo",
  multiselect: "Seleção múltipla",
  number: "Número",
  phone: "Telefone",
  select: "Seleção única",
  text: "Texto",
  textarea: "Texto longo",
  time: "Horário",
};

export const EVENTO_CLOSING_FIELD_KEYS = new Set<string>([
  "cliente_nome",
  "cliente_telefone",
  "cliente_email",
  "cliente_cpf",
  "cliente_rg",
  "cliente_cep",
  "cliente_rua",
  "cliente_numero",
  "cliente_bairro",
  "cliente_cidade",
  "cliente_estado",
  "aniversariante_nome",
  "aniversariante_data_nascimento",
  "aniversariante_idade",
  "aniversariante_tema",
  "aniversariante_personagem",
  "data_evento",
  "hora_evento",
  "hora_termino",
  "quantidade_convidados",
  "quantidade_adultos",
  "quantidade_crianas",
  "observacoes_festa",
  "pacote_nome",
  "pacote_convidados_inclusos",
  "valor_pacote",
  "valor_adicionais",
  "valor_total",
  "valor_entrada",
  "valor_saldo",
  "forma_pagamento_entrada",
  "forma_pagamento_saldo",
  "parcelas",
  "data_limite_pagamento",
  "observacoes",
]);

export const isEventoMappedField = (fieldKey: string | null): fieldKey is EventoClosingFieldKey =>
  Boolean(fieldKey && EVENTO_CLOSING_FIELD_KEYS.has(fieldKey));

/** Seções exibidas na aba Estrutura do formulário de contratação */
export const STRUCTURE_FORM_SECTIONS: ClosingFormSection[] = [
  "cliente",
  "aniversariante",
  "festa",
  "pacote",
  "adicionais",
  "pagamento",
  "contrato",
  "aceites",
];

/** Tipos permitidos para campos personalizados (aceite fica na aba Aceites) */
export const CUSTOM_CLOSING_FIELD_TYPES: ClosingFormFieldType[] = [
  "text",
  "email",
  "phone",
  "date",
  "time",
  "number",
  "currency",
  "textarea",
  "checkbox",
  "select",
  "multiselect",
  "file",
];

export const CLOSING_FORM_USAGE_LABELS: Record<keyof ClosingFormFieldUsage, string> = {
  contract: "Contrato",
  partySummary: "Resumo da festa",
  internalTask: "Tarefa interna",
  ai: "IA",
  checklist: "Checklist",
  reports: "Relatórios",
};

export interface ClosingFormFieldConfig {
  max?: number;
  min?: number;
  options?: string[];
  pattern?: string;
}

export const parseFieldConfig = (config: Record<string, unknown>): ClosingFormFieldConfig => ({
  max: typeof config.max === "number" ? config.max : undefined,
  min: typeof config.min === "number" ? config.min : undefined,
  options: Array.isArray(config.options)
    ? config.options.filter((item): item is string => typeof item === "string")
    : undefined,
  pattern: typeof config.pattern === "string" ? config.pattern : undefined,
});

export interface ClosingFormFieldUpdatePayload {
  active?: boolean;
  category?: ClosingFormFieldCategory;
  config?: Record<string, unknown>;
  description?: string | null;
  fieldId: string;
  fieldType?: ClosingFormFieldType;
  label?: string;
  required?: boolean;
  section?: ClosingFormSection;
  usage?: Partial<ClosingFormFieldUsage>;
}
