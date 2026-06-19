import type { PackageData } from "@/data/packagesData";

import { normalizePackageMatchKey } from "./resolve-package-by-name";

export interface EventoPackageDisplay {
  isLegacy: boolean;
  label: string;
}

type EventoPackageSource = {
  pacote_id: number | null;
  pacote_nome: string | null;
};

type PackageCatalogEntry = Pick<PackageData, "id" | "name">;

const matchesPackageName = (storedName: string, catalogName: string) =>
  normalizePackageMatchKey(storedName) === normalizePackageMatchKey(catalogName);

export const getEventoPackageDisplay = (
  evento: EventoPackageSource,
  packages: PackageCatalogEntry[] = [],
): EventoPackageDisplay => {
  const storedName = evento.pacote_nome?.trim();

  if (!storedName) {
    return { isLegacy: false, label: "Pacote nao informado" };
  }

  if (packages.length === 0) {
    return { isLegacy: evento.pacote_id == null, label: storedName };
  }

  const linkedPackage =
    evento.pacote_id != null
      ? packages.find((pkg) => Number(pkg.id) === evento.pacote_id) ?? null
      : null;

  if (linkedPackage) {
    return {
      isLegacy: !matchesPackageName(storedName, linkedPackage.name),
      label: storedName,
    };
  }

  const namedMatch = packages.find((pkg) => matchesPackageName(storedName, pkg.name)) ?? null;

  return {
    isLegacy: namedMatch == null,
    label: storedName,
  };
};
