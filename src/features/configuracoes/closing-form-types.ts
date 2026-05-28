export type ClosingFormSection = "cliente" | "aniversariante" | "festa" | "financeiro" | "contrato";

export type ClosingFormFieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "number"
  | "currency"
  | "textarea"
  | "checkbox";

export type EventoClosingFieldKey =
  | "cliente_nome"
  | "cliente_telefone"
  | "cliente_email"
  | "aniversariante_nome"
  | "aniversariante_data_nascimento"
  | "data_evento"
  | "hora_evento"
  | "quantidade_convidados"
  | "pacote_nome"
  | "valor_pacote"
  | "valor_adicionais"
  | "valor_total"
  | "valor_entrada"
  | "observacoes";

export interface ClosingFormField {
  active: boolean;
  fieldKey: string | null;
  fieldType: ClosingFormFieldType;
  id: string;
  isSystem: boolean;
  label: string;
  required: boolean;
  section: ClosingFormSection;
  sortOrder: number;
}

export const closingFormSectionLabels: Record<ClosingFormSection, string> = {
  aniversariante: "Aniversariante",
  cliente: "Cliente / Responsável",
  contrato: "Contrato e observações",
  festa: "Dados da festa",
  financeiro: "Valores e pagamento",
};

export const closingFormFieldTypeLabels: Record<ClosingFormFieldType, string> = {
  checkbox: "Sim/Não",
  currency: "Valor (R$)",
  date: "Data",
  email: "E-mail",
  number: "Número",
  phone: "Telefone",
  text: "Texto",
  textarea: "Texto longo",
  time: "Horário",
};

export const EVENTO_CLOSING_FIELD_KEYS = new Set<string>([
  "cliente_nome",
  "cliente_telefone",
  "cliente_email",
  "aniversariante_nome",
  "aniversariante_data_nascimento",
  "data_evento",
  "hora_evento",
  "quantidade_convidados",
  "pacote_nome",
  "valor_pacote",
  "valor_adicionais",
  "valor_total",
  "valor_entrada",
  "observacoes",
]);

export const isEventoMappedField = (fieldKey: string | null): fieldKey is EventoClosingFieldKey =>
  Boolean(fieldKey && EVENTO_CLOSING_FIELD_KEYS.has(fieldKey));
