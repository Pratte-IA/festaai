export const LEGACY_CONTRACT_STUB_MARKER = "Modelo base FestaAI";

const normalizeTemplateHtml = (html: string): string => html.replace(/\s+/g, " ").trim();

/** Stub temporário criado antes dos modelos completos estarem disponíveis. */
export const isLegacyContractTemplateStub = (html: string | null | undefined): boolean =>
  Boolean(html?.includes(LEGACY_CONTRACT_STUB_MARKER));

/** Tenant editou e salvou uma versão diferente do contrato base do sistema. */
export const isTenantContractTemplateCustomized = (
  storedHtml: string | null | undefined,
  defaultHtml: string,
): boolean => {
  const trimmed = storedHtml?.trim();
  if (!trimmed || isLegacyContractTemplateStub(trimmed)) return false;

  return normalizeTemplateHtml(trimmed) !== normalizeTemplateHtml(defaultHtml);
};

/**
 * HTML efetivo do contrato: contrato base completo do sistema, salvo se o tenant
 * tiver personalizado e persistido uma versão própria.
 */
export const resolveContractTemplateHtml = (
  storedHtml: string | null | undefined,
  defaultHtml: string,
): string => {
  if (isTenantContractTemplateCustomized(storedHtml, defaultHtml)) {
    return storedHtml!.trim();
  }

  return defaultHtml;
};
