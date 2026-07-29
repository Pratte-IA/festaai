import { DEFAULT_PAGE_SIZE } from "./constants";
import type { RadarCrmFilters } from "./types";

export const createDefaultRadarFilters = (): RadarCrmFilters => ({
  search: "",
  statuses: [],
  priorities: [],
  city: "",
  state: "",
  category: "",
  hasInstagram: null,
  hasPhone: null,
  hasWhatsapp: null,
  hasWebsite: null,
  cnpjValidated: null,
  registrationActive: null,
  hasAdministrator: null,
  assignedUserId: "",
  nextActionFrom: "",
  nextActionTo: "",
  withoutContact: false,
  overdueNextAction: false,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
});

export const hasActiveRadarFilters = (filters: RadarCrmFilters): boolean =>
  Boolean(
    filters.search.trim() ||
      filters.statuses.length ||
      filters.priorities.length ||
      filters.city ||
      filters.state ||
      filters.category ||
      filters.hasInstagram !== null ||
      filters.hasPhone !== null ||
      filters.hasWhatsapp !== null ||
      filters.hasWebsite !== null ||
      filters.cnpjValidated !== null ||
      filters.registrationActive !== null ||
      filters.hasAdministrator !== null ||
      filters.assignedUserId ||
      filters.nextActionFrom ||
      filters.nextActionTo ||
      filters.withoutContact ||
      filters.overdueNextAction,
  );

export const formatCnpjDisplay = (value: string | null | undefined): string => {
  if (!value) return "Não informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export const formatPhoneDisplay = (value: string | null | undefined): string => {
  if (!value) return "Não informado";
  return value;
};

export const buildWhatsappUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
};

export const displayOrFallback = (value: string | null | undefined, fallback = "Não informado") => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

export const meiLabel = (value: string | null | undefined): string => {
  if (value == null || value === "") return "Não informado";
  const normalized = value.toLowerCase();
  if (normalized === "true" || normalized === "t" || normalized === "1" || normalized === "sim") {
    return "Sim";
  }
  if (normalized === "false" || normalized === "f" || normalized === "0" || normalized === "nao" || normalized === "não") {
    return "Não";
  }
  return value;
};
