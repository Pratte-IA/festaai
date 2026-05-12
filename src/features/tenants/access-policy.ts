import { TenantStatus } from "./types";

const blockedTenantStatuses: TenantStatus[] = ["canceled", "suspended"];

export const canAccessTenantApp = (status: TenantStatus) => !blockedTenantStatuses.includes(status);
