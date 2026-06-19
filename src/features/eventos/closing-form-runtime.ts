import type { Additional, PackageData } from "@/data/packagesData";
import { itemsToLines } from "@/data/packagesData";
import { getTierBandPrice } from "@/data/pricing-schedule";
import type {
  ClosingFormField,
  ClosingFormFieldType,
  ClosingFormSection,
} from "@/features/configuracoes/closing-form-types";
import type { Evento, EventoUpdate } from "@/features/eventos/types";
import type { Json } from "@/lib/supabase/database.types";

const EMPTY_RESPONSE_LABEL = "Não informado";

const formatDateValue = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCurrencyValue = (value: string): string => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const formatClosingFormResponseValue = (
  fieldType: ClosingFormFieldType,
  value: string,
): string => {
  const trimmed = value.trim();
  if (!trimmed) return EMPTY_RESPONSE_LABEL;

  switch (fieldType) {
    case "checkbox":
      return trimmed === "true" ? "Sim" : "Não";
    case "currency":
      return formatCurrencyValue(trimmed);
    case "date":
      return formatDateValue(trimmed);
    case "time":
      return trimmed.slice(0, 5);
    case "multiselect":
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(", ");
    case "file":
      return trimmed.startsWith("http") ? trimmed : "Arquivo enviado";
    default:
      return trimmed;
  }
};

export const isCustomClosingFormField = (field: {
  fieldType: ClosingFormFieldType;
  isSystem: boolean;
}): boolean => !field.isSystem && field.fieldType !== "acceptance";

export const isClosingFormFieldApplicableToPackage = (
  field: Pick<ClosingFormField, "isSystem" | "packageIds">,
  packageId: string | null | undefined,
): boolean => {
  if (field.isSystem) return true;

  const ids = field.packageIds ?? [];
  if (ids.length === 0) return true;
  if (!packageId) return false;

  return ids.includes(packageId);
};

export const PACKAGE_SELECTOR_FIELD_KEY = "pacote_nome";

export const HIDDEN_PACKAGE_FIELD_KEYS = new Set([
  "valor_pacote",
  "pacote_convidados_inclusos",
  "pacote_itens_inclusos",
  "pacote_itens_nao_inclusos",
]);

export const isHiddenPackageFieldKey = (fieldKey: string | null): boolean =>
  Boolean(fieldKey && HIDDEN_PACKAGE_FIELD_KEYS.has(fieldKey));

export const CLOSING_FORM_SECTIONS: ClosingFormSection[] = [
  "cliente",
  "aniversariante",
  "festa",
  "pacote",
  "adicionais",
  "pagamento",
  "contrato",
  "aceites",
];

export interface AdicionalSnapshotItem {
  category: string;
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  type: string;
}

export interface AcceptanceResponsePayload {
  accepted: boolean;
  termId: number;
}

export const getEventoFieldValueAsString = (evento: Evento, fieldKey: string): string => {
  if (!(fieldKey in evento)) return "";

  const value = evento[fieldKey as keyof Evento];
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toString();
  if (fieldKey === "hora_evento" || fieldKey === "hora_termino") return String(value).slice(0, 5);

  return String(value);
};

export const parseAdicionaisSnapshot = (value: Json | null | undefined): AdicionalSnapshotItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "number" || typeof row.name !== "string") return [];

    return [
      {
        category: typeof row.category === "string" ? row.category : "outros",
        id: row.id,
        name: row.name,
        price: typeof row.price === "number" ? row.price : 0,
        quantity: typeof row.quantity === "number" && row.quantity > 0 ? row.quantity : 1,
        subtotal: typeof row.subtotal === "number" ? row.subtotal : 0,
        type: typeof row.type === "string" ? row.type : "fixo",
      },
    ];
  });
};

export const getPackageFromPrice = (pkg: PackageData): number => {
  const tiers = pkg.pricingTiers ?? [];
  const bands = pkg.pricingSchedule?.bands ?? [];
  if (tiers.length === 0) return 0;

  const prices = tiers.flatMap((tier) =>
    bands.length > 0
      ? bands.map((band) => getTierBandPrice(tier.bandPrices, band.id))
      : [0],
  );

  const positive = prices.filter((price) => price > 0);
  return positive.length > 0 ? Math.min(...positive) : 0;
};

export const getPackagePriceForGuests = (pkg: PackageData, guestCount: number): number => {
  const tiers = pkg.pricingTiers ?? [];
  const bands = pkg.pricingSchedule?.bands ?? [];
  if (tiers.length === 0) return 0;

  const tier =
    tiers.find((item) => guestCount >= item.minGuests && guestCount <= item.maxGuests) ??
    tiers[tiers.length - 1];

  if (bands.length === 0) return 0;

  const prices = bands.map((band) => getTierBandPrice(tier.bandPrices, band.id));
  const positive = prices.filter((price) => price > 0);
  return positive.length > 0 ? Math.min(...positive) : prices[0] ?? 0;
};

export const calculateAdditionalSubtotal = (
  additional: Pick<Additional, "price" | "type">,
  quantity: number,
  guestCount: number,
): number => {
  const qty = Math.max(quantity, 1);
  const guests = Math.max(guestCount, 1);

  switch (additional.type) {
    case "por_pessoa":
      return additional.price * guests * qty;
    case "por_hora":
    case "por_unidade":
      return additional.price * qty;
    default:
      return additional.price * qty;
  }
};

export const buildAdicionaisSnapshot = (
  additionals: Additional[],
  selections: Map<string, number>,
  guestCount: number,
): AdicionalSnapshotItem[] =>
  additionals
    .filter((item) => selections.has(item.id))
    .map((item) => {
      const quantity = selections.get(item.id) ?? 1;
      const subtotal = calculateAdditionalSubtotal(item, quantity, guestCount);

      return {
        category: item.category,
        id: Number(item.id),
        name: item.name,
        price: item.price,
        quantity,
        subtotal,
        type: item.type,
      };
    });

export const getAdditionalsTotal = (snapshot: AdicionalSnapshotItem[]): number =>
  snapshot.reduce((sum, item) => sum + item.subtotal, 0);

export const applyPackageToFieldValues = (
  pkg: PackageData,
  guestCount: number,
  fieldValues: Record<string, string>,
  fieldIdByKey: Map<string, string>,
): Record<string, string> => {
  const next = { ...fieldValues };
  const price = guestCount > 0 ? getPackagePriceForGuests(pkg, guestCount) : getPackageFromPrice(pkg);

  const setKey = (key: string, value: string) => {
    const fieldId = fieldIdByKey.get(key);
    if (fieldId) next[fieldId] = value;
  };

  setKey("pacote_nome", pkg.name);
  setKey("valor_pacote", String(price));
  if (pkg.includedGuests != null) {
    setKey("pacote_convidados_inclusos", String(pkg.includedGuests));
  }
  setKey("pacote_itens_inclusos", itemsToLines(pkg.includedItems));
  setKey("pacote_itens_nao_inclusos", itemsToLines(pkg.excludedItems));

  return next;
};

export const buildPackageEventoUpdates = (
  pkg: PackageData,
  guestCount: number,
): Pick<EventoUpdate, "pacote_convidados_inclusos" | "pacote_nome" | "valor_pacote"> => ({
  pacote_convidados_inclusos: pkg.includedGuests ?? null,
  pacote_nome: pkg.name,
  valor_pacote: guestCount > 0 ? getPackagePriceForGuests(pkg, guestCount) : getPackageFromPrice(pkg),
});

export const recalculateFinancialTotals = (
  fieldValues: Record<string, string>,
  fieldIdByKey: Map<string, string>,
  options?: { pacoteValue?: number },
): Record<string, string> => {
  const next = { ...fieldValues };
  const get = (key: string) => {
    const id = fieldIdByKey.get(key);
    return id ? Number(next[id] || 0) : 0;
  };
  const set = (key: string, value: number) => {
    const id = fieldIdByKey.get(key);
    if (id) next[id] = String(value);
  };

  const pacote = options?.pacoteValue ?? get("valor_pacote");
  const adicionais = get("valor_adicionais");
  const total = pacote + adicionais;
  const entrada = get("valor_entrada");

  if (fieldIdByKey.has("valor_total")) set("valor_total", total);
  if (fieldIdByKey.has("valor_saldo")) set("valor_saldo", Math.max(total - entrada, 0));

  return next;
};

export const buildFieldIdByKey = (
  fields: Array<{ fieldKey: string | null; id: string }>,
): Map<string, string> => {
  const map = new Map<string, string>();
  fields.forEach((field) => {
    if (field.fieldKey) map.set(field.fieldKey, field.id);
  });
  return map;
};

export const resolveGuestCount = (
  evento: Evento,
  fieldValues: Record<string, string>,
  fieldIdByKey: Map<string, string>,
): number => {
  const fieldId = fieldIdByKey.get("quantidade_convidados");
  const fromField = fieldId ? Number(fieldValues[fieldId] || 0) : 0;
  return fromField || evento.quantidade_convidados || 0;
};
