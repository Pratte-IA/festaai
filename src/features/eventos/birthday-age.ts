import { getTodayAtNoon, parseIsoDateLocal } from "@/lib/date";

const DAY_MS = 1000 * 60 * 60 * 24;

const toIsoDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getMostRecentBirthday = (birth: Date, party: Date): Date => {
  let year = party.getFullYear();
  let anniversary = new Date(year, birth.getMonth(), birth.getDate(), 12, 0, 0, 0);

  if (party.getTime() < anniversary.getTime()) {
    anniversary = new Date(year - 1, birth.getMonth(), birth.getDate(), 12, 0, 0, 0);
  }

  return anniversary;
};

const getNextBirthday = (birth: Date, party: Date): Date => {
  let year = party.getFullYear();
  let anniversary = new Date(year, birth.getMonth(), birth.getDate(), 12, 0, 0, 0);

  if (party.getTime() > anniversary.getTime()) {
    anniversary = new Date(year + 1, birth.getMonth(), birth.getDate(), 12, 0, 0, 0);
  }

  return anniversary;
};

/** Idade em anos completos na data de referência. */
export const computeAgeOnDate = (
  birthDate: string | null | undefined,
  referenceDate: string | Date | null | undefined,
): number | null => {
  if (!birthDate || !referenceDate) return null;

  const birth = parseIsoDateLocal(birthDate);
  if (!birth) return null;

  const reference =
    referenceDate instanceof Date ? referenceDate : parseIsoDateLocal(referenceDate);
  if (!reference) return null;

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
};

/**
 * Idade que a festa comemora ("idade que irá completar").
 * Considera festas antecipadas e comemorações logo após o aniversário.
 */
export const computeCelebratingAge = (
  birthDate: string | null | undefined,
  partyDate: string | null | undefined,
): number | null => {
  const birth = parseIsoDateLocal(birthDate ?? "");
  const party = parseIsoDateLocal(partyDate ?? "");
  if (!birth || !party) return null;

  const recentBirthday = getMostRecentBirthday(birth, party);
  const nextBirthday = getNextBirthday(birth, party);
  const ageAtRecent = computeAgeOnDate(birthDate, toIsoDateKey(recentBirthday));
  const ageAtNext = computeAgeOnDate(birthDate, toIsoDateKey(nextBirthday));

  if (ageAtRecent === null || ageAtNext === null) return null;

  if (party.getTime() >= nextBirthday.getTime()) {
    return ageAtRecent;
  }

  if (party.getTime() > recentBirthday.getTime()) {
    const daysSinceRecent = Math.round((party.getTime() - recentBirthday.getTime()) / DAY_MS);
    const daysUntilNext = Math.round((nextBirthday.getTime() - party.getTime()) / DAY_MS);

    if (daysUntilNext <= daysSinceRecent) {
      return ageAtNext;
    }

    if (ageAtRecent === 0) {
      return ageAtNext;
    }

    return ageAtRecent;
  }

  return ageAtNext;
};

export const formatAgeYears = (age: number | null): string => {
  if (age === null) return "Nao informado";
  return age === 1 ? "1 ano" : `${age} anos`;
};

export const formatCurrentAge = (birthDate: string | null | undefined): string =>
  formatAgeYears(computeAgeOnDate(birthDate, getTodayAtNoon()));

export const formatCelebratingAge = (
  birthDate: string | null | undefined,
  partyDate: string | null | undefined,
): string => formatAgeYears(computeCelebratingAge(birthDate, partyDate));
