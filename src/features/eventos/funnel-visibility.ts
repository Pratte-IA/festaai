import type { TenantUnit } from "@/features/tenants/types";

import { funnelTabs } from "./constants";
import type { FunnelDefinition, FunnelType } from "./types";

/** Vendas fica centralizado na matriz quando o tenant tem filial. */
export const isVendasAvailableForUnit = (unit: TenantUnit | null | undefined): boolean => {
  if (!unit) return true;
  return unit.kind !== "filial";
};

export const getFunnelTabsForUnit = (unit: TenantUnit | null | undefined): FunnelDefinition[] => {
  if (isVendasAvailableForUnit(unit)) {
    return funnelTabs;
  }

  return funnelTabs.filter((tab) => tab.key !== "vendas");
};

export const getDefaultFunnelForUnit = (unit: TenantUnit | null | undefined): FunnelType =>
  isVendasAvailableForUnit(unit) ? "vendas" : "festa";

export const resolveFunnelForUnit = (
  funnel: FunnelType,
  unit: TenantUnit | null | undefined,
): FunnelType => {
  if (funnel === "vendas" && !isVendasAvailableForUnit(unit)) {
    return "festa";
  }

  return funnel;
};

/** Leads do funil Vendas sempre pertencem à unidade matriz. */
export const resolveUnitIdForFunnel = (
  funil: FunnelType,
  currentUnitId: number | null,
  units: TenantUnit[],
): number | null => {
  if (funil !== "vendas") {
    return currentUnitId;
  }

  const matriz = units.find((unit) => unit.kind === "matriz" && unit.status === "active");
  return matriz?.id ?? currentUnitId;
};
