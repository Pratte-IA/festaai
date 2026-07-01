import {
  isContractTemplateKey,
  type ContractTemplateKey,
} from "./contract-template-types";

export type PackageTemplateMap = Partial<Record<string, ContractTemplateKey>>;

export const parsePackageTemplateMap = (value: unknown): PackageTemplateMap => {
  if (!value || typeof value !== "object") return {};

  const map: PackageTemplateMap = {};
  for (const [packageId, templateKey] of Object.entries(value as Record<string, unknown>)) {
    if (typeof templateKey === "string" && isContractTemplateKey(templateKey)) {
      map[packageId] = templateKey;
    }
  }

  return map;
};

export const resolveContractTemplateKeyForPackage = (
  packageId: number | string | null | undefined,
  options: {
    defaultTemplateKey: ContractTemplateKey | null;
    packageTemplateMap: PackageTemplateMap;
  },
): ContractTemplateKey | null => {
  if (packageId != null) {
    const mapped = options.packageTemplateMap[String(packageId)];
    if (mapped) return mapped;
  }

  return options.defaultTemplateKey;
};
