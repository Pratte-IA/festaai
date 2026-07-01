export const LEGACY_CONTRACT_STUB_MARKER = "Modelo base FestaAI";

/** Modelo legado anterior ao sistema de tipos de contrato (festa infantil). */
export const LEGACY_PRE_MIGRATION_CONTRACT_MARKER =
  "CONTRATO DE PRESTAÇÃO DE SERVIÇOS PARA FESTA INFANTIL";

const normalizeTemplateHtml = (html: string): string => html.replace(/\s+/g, " ").trim();

export const isLegacyContractTemplateStub = (html: string | null | undefined): boolean =>
  Boolean(html?.includes(LEGACY_CONTRACT_STUB_MARKER));

export const isLegacyPreMigrationContractTemplate = (html: string | null | undefined): boolean =>
  Boolean(html?.includes(LEGACY_PRE_MIGRATION_CONTRACT_MARKER));

export const isTenantContractTemplateCustomized = (
  storedHtml: string | null | undefined,
  defaultHtml: string,
): boolean => {
  const trimmed = storedHtml?.trim();
  if (
    !trimmed ||
    isLegacyContractTemplateStub(trimmed) ||
    isLegacyPreMigrationContractTemplate(trimmed)
  ) {
    return false;
  }

  return normalizeTemplateHtml(trimmed) !== normalizeTemplateHtml(defaultHtml);
};

export const resolveContractTemplateHtml = (
  storedHtml: string | null | undefined,
  defaultHtml: string,
): string => {
  if (isTenantContractTemplateCustomized(storedHtml, defaultHtml)) {
    return storedHtml!.trim();
  }

  return defaultHtml;
};
