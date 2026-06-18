import type { ClosingFormField, ClosingFormSection } from "@/features/configuracoes/closing-form-types";
import type { Additional, PackageData } from "@/data/packagesData";

export interface PublicAcceptanceTerm {
  active: boolean;
  appearsInContract: boolean;
  content: string;
  id: string;
  isRequired: boolean;
  sortOrder: number;
  title: string;
}

export interface PublicPaymentMethod {
  allowedForDeposit: boolean;
  allowedForRemainingBalance: boolean;
  id: string;
  name: string;
  sortOrder: number;
  type: string;
}

export interface PublicFinancialSettings {
  cancellation_policy: string | null;
  installment_limit_mode: string;
  max_balance_due_days: number | null;
  max_deposit_due_days: number | null;
  max_installments: number;
  min_deposit_percentage: number | null;
  rescheduling_policy: string | null;
}

export interface ClientContractFormConfig {
  acceptanceTerms: PublicAcceptanceTerm[];
  additionals: Additional[];
  fields: ClosingFormField[];
  financialSettings: PublicFinancialSettings | null;
  packages: PackageData[];
  paymentMethods: PublicPaymentMethod[];
  tenantName: string;
  tenantSlug: string;
}

export interface ClientContractFormSubmitResult {
  advancedToFesta: boolean;
  etapa: string;
  eventoId: number;
  funil: string;
  message: string;
  whatsappDispatchScheduled?: boolean;
}

export const PUBLIC_FORM_SECTIONS: ClosingFormSection[] = [
  "cliente",
  "aniversariante",
  "festa",
  "pacote",
  "adicionais",
  "pagamento",
  "contrato",
  "aceites",
];

export const buildPublicFormUrl = (tenantSlug: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/formulario/${tenantSlug}`;
