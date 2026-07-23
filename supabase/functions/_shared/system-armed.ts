export const SYSTEM_NOT_ARMED_SKIP_REASON = "Sistema não ativado para este tenant.";

export const isTenantSystemArmed = (
  settings: { system_armed?: boolean | null } | null | undefined,
): boolean => settings?.system_armed === true;
