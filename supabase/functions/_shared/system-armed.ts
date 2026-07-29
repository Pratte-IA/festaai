export const SYSTEM_NOT_ARMED_SKIP_REASON = "Sistema não ativado para este tenant.";

export const isTenantSystemArmed = (
  settings: { system_armed?: boolean | null } | null | undefined,
): boolean => settings?.system_armed === true;

/**
 * Mensagens / marcos anteriores a `system_armed_at` não disparam nem mostram
 * timer de FU0 — o backlog pré-ativação é tratado manualmente.
 */
export const clampAwaitingSinceToSystemArmedAt = (
  awaitingSince: string | null,
  systemArmedAt: string | null | undefined,
): string | null => {
  if (!awaitingSince) return null;
  if (!systemArmedAt) return awaitingSince;

  const awaitingMs = new Date(awaitingSince).getTime();
  const armedMs = new Date(systemArmedAt).getTime();
  if (!Number.isFinite(awaitingMs) || !Number.isFinite(armedMs)) return awaitingSince;
  if (awaitingMs < armedMs) return null;

  return awaitingSince;
};
