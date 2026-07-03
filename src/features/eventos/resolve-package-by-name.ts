import { PackageData } from "@/data/packagesData";
import { sanitizePackageAutomationNameInput } from "@/lib/package-automation-name";

export type PackageMatchCandidate = Pick<PackageData, "id" | "name" | "nameAutomacao" | "active">;

/** Normaliza texto para comparacao tolerante (acentos, prefixo "pacote", espacos). */
export const normalizePackageMatchKey = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^pacote\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

const scorePackageMatch = (query: string, pkgKey: string): number | null => {
  if (!pkgKey) return null;

  if (pkgKey === query) {
    return 100;
  }

  if (pkgKey.includes(query)) {
    return 80 - (pkgKey.length - query.length);
  }

  if (query.includes(pkgKey)) {
    return 70 - (query.length - pkgKey.length);
  }

  return null;
};

/**
 * Resolve um pacote cadastrado a partir de texto livre no CSV.
 * Aceita variacoes de acento, prefixo "Pacote" e quando o texto contem (ou esta contido em) o nome cadastrado.
 */
export const resolvePackageByName = <T extends PackageMatchCandidate>(
  rawName: string | null | undefined,
  packages: T[],
): T | null => {
  const query = normalizePackageMatchKey(rawName ?? "");
  if (!query) return null;

  const candidates = packages.filter((pkg) => pkg.active !== false);
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((pkg) => {
      const score = scorePackageMatch(query, normalizePackageMatchKey(pkg.name));
      return score == null ? null : { pkg, score };
    })
    .filter((item): item is { pkg: T; score: number } => item != null);

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return normalizePackageMatchKey(a.pkg.name).length - normalizePackageMatchKey(b.pkg.name).length;
  });

  return scored[0].pkg;
};

/** Resolve pacote pelo identificador estável de automação (`name_automacao`). */
export const resolvePackageByAutomationName = <T extends PackageMatchCandidate>(
  rawAutomationName: string | null | undefined,
  packages: T[],
): T | null => {
  const query = sanitizePackageAutomationNameInput(rawAutomationName ?? "");
  if (!query) return null;

  const candidates = packages.filter((pkg) => pkg.active !== false);
  return candidates.find((pkg) => pkg.nameAutomacao === query) ?? null;
};
