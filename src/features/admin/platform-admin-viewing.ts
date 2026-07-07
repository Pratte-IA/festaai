const PLATFORM_ADMIN_VIEWING_KEY = "festaai.platformAdminViewingTenantId";
const PLATFORM_ADMIN_PREVIOUS_TENANT_KEY = "festaai.platformAdminPreviousTenantId";

const parsePositiveTenantId = (value: string | null): number | null => {
  const tenantId = value ? Number(value) : null;
  return Number.isInteger(tenantId) && tenantId > 0 ? tenantId : null;
};

export const getPlatformAdminViewingTenantId = (): number | null => {
  if (typeof window === "undefined") return null;
  return parsePositiveTenantId(sessionStorage.getItem(PLATFORM_ADMIN_VIEWING_KEY));
};

export const getPlatformAdminPreviousTenantId = (): number | null => {
  if (typeof window === "undefined") return null;
  return parsePositiveTenantId(sessionStorage.getItem(PLATFORM_ADMIN_PREVIOUS_TENANT_KEY));
};

export const setPlatformAdminViewingTenantId = (tenantId: number, previousTenantId?: number | null) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLATFORM_ADMIN_VIEWING_KEY, String(tenantId));

  if (previousTenantId != null) {
    sessionStorage.setItem(PLATFORM_ADMIN_PREVIOUS_TENANT_KEY, String(previousTenantId));
  }
};

export const clearPlatformAdminViewingTenantId = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PLATFORM_ADMIN_VIEWING_KEY);
  sessionStorage.removeItem(PLATFORM_ADMIN_PREVIOUS_TENANT_KEY);
};
