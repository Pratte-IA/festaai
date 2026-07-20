export type HolidayScope = "national" | "state" | "municipal" | "tenant";
export type TenantHolidayScope = "state" | "municipal" | "tenant";
export type HolidayKind = "official" | "optional" | "custom";
export type HolidaySource = "automatic" | "tenant";
export type HolidayRecurrenceType = "fixed_annual" | "movable_annual" | "one_time";

export interface TenantHolidayCalendarEntry {
  active: boolean;
  date: string;
  editable: boolean;
  id: number | null;
  kind: HolidayKind;
  name: string;
  recurrenceType: HolidayRecurrenceType;
  recursAnnually: boolean;
  scope: HolidayScope;
  source: HolidaySource;
}

export interface TenantHolidayInput {
  active: boolean;
  holidayDate: string;
  kind: HolidayKind;
  name: string;
  recursAnnually: boolean;
  scope: TenantHolidayScope;
}

export interface CheckTenantHolidayResult {
  date: string;
  holidayKind: HolidayKind | null;
  holidayName: string | null;
  holidayScope: HolidayScope | null;
  holidaySource: HolidaySource | null;
  isHoliday: boolean;
}

export const HOLIDAY_SCOPE_LABELS: Record<HolidayScope, string> = {
  municipal: "Municipal",
  national: "Nacional",
  state: "Estadual",
  tenant: "Empresa",
};

export const HOLIDAY_KIND_LABELS: Record<HolidayKind, string> = {
  custom: "Personalizado",
  official: "Oficial",
  optional: "Facultativo / comercial",
};

export const HOLIDAY_RECURRENCE_LABELS: Record<HolidayRecurrenceType, string> = {
  fixed_annual: "Todo ano (data fixa)",
  movable_annual: "Todo ano (data móvel)",
  one_time: "Somente nesta data",
};

export const defaultTenantHolidayInput = (): TenantHolidayInput => ({
  active: true,
  holidayDate: "",
  kind: "official",
  name: "",
  recursAnnually: true,
  scope: "municipal",
});
