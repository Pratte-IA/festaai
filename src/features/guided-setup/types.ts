import type { GuidedSetupStepKey } from "./guided-setup-steps";

export interface TenantCompanyProfile {
  addressCity: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressNumber: string | null;
  addressState: string | null;
  addressStreet: string | null;
  addressCep: string | null;
  cnpj: string | null;
  companyName: string | null;
  completedAt: string | null;
  legalRepresentativeCpf: string | null;
  legalRepresentativeName: string | null;
  tenantId: number;
}

export interface TenantCompanyProfileInput {
  addressCity: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressNumber: string;
  addressState: string;
  addressStreet: string;
  addressCep: string;
  cnpj: string;
  companyName: string;
  legalRepresentativeCpf: string;
  legalRepresentativeName: string;
}

export interface TenantGuidedSetupProgress {
  completedAt: string | null;
  completedSteps: GuidedSetupStepKey[];
  currentStep: GuidedSetupStepKey | "completed";
  tenantId: number;
}
