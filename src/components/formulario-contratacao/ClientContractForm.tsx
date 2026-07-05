import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, FileCheck2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  isAdditionalApplicableToPackage,
  type PackageData,
} from "@/data/packagesData";
import {
  buildAcceptanceResponsesPayload,
  buildDefaultTermResponses,
  parseFieldConfig,
  validateAcceptanceTermResponses,
  type ClosingFormField,
  type ClosingFormSection,
} from "@/features/configuracoes";
import {
  applyPackageToFieldValues,
  buildAdicionaisSnapshot,
  buildFieldIdByKey,
  buildPackageEventoUpdates,
  CALCULATED_CLOSING_FORM_FIELD_KEYS,
  filterClientVisiblePaymentFields,
  formatAdicionaisSelecionadosLabel,
  getAdditionalsTotal,
  isClientFacingClosingFormField,
  isClientPaymentSummaryFieldKey,
  computeClosingFormPaymentSummary,
  resolveEventDateFromFieldValues,
  resolvePackagePrice,
  isClosingFormFieldApplicableToPackage,
  isHiddenPackageFieldKey,
  omitCalculatedClosingFormFieldValues,
  PACKAGE_SELECTOR_FIELD_KEY,
  recalculateClosingFormFinancials,
  recalculateFinancialTotals,
  resolveGuestCount,
} from "@/features/eventos/closing-form-runtime";
import {
  buildGuestCountHelperText,
  buildGuestCountOptions,
  normalizeGuestCountValue,
  resolveMaxGuestCount,
  validateGuestCountValue,
} from "@/features/eventos/guest-count-input";
import type { Evento } from "@/features/eventos/types";
import {
  PUBLIC_FORM_SECTIONS,
  type ClientContractAcceptResult,
  type ClientContractFormConfig,
  type ClientContractFormSubmitResult,
  useSubmitClientContractForm,
} from "@/features/public-contract-form";
import type { BalancePaymentOption } from "@/features/public-contract-form/balance-payment-option";
import {
  clearClientContractFormDraft,
  loadClientContractFormDraft,
  saveClientContractFormDraft,
} from "@/features/public-contract-form/client-contract-form-draft";
import { cn } from "@/lib/utils";
import { fetchAddressByCep } from "@/lib/cep";
import { formatCepInput, formatCpfInput, isValidCep, onlyDigits } from "@/lib/brazil-documents";
import { getBrazilMobilePhoneValidationError } from "@/lib/phone";
import { toast } from "@/hooks/use-toast";

import { ClientContractSigningStep } from "./ClientContractSigningStep";
import { AcceptanceTermResponseField, setTermResponse } from "./AcceptanceTermResponseField";
import { AdditionalSelectionList } from "./AdditionalSelectionList";
import { ClientBalancePaymentOptions } from "./ClientBalancePaymentOptions";
import { ClientPaymentValueSummary } from "./ClientPaymentValueSummary";
import { getClientFormSectionGuide } from "./client-form-section-guide";

type ClientFormStep = "form" | "contract" | "done";

const EMPTY_EVENTO = { quantidade_convidados: 0 } as Evento;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface ClientContractFormProps {
  config: ClientContractFormConfig;
  onSuccess?: (result: ClientContractFormSubmitResult) => void;
}

export const ClientContractForm = ({ config, onSuccess }: ClientContractFormProps) => {
  const submitForm = useSubmitClientContractForm();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [additionalSelections, setAdditionalSelections] = useState<Map<string, number>>(new Map());
  const [termResponses, setTermResponses] = useState<Record<string, boolean | undefined>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<ClientFormStep>("form");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [submitResult, setSubmitResult] = useState<ClientContractFormSubmitResult | null>(null);
  const [acceptResult, setAcceptResult] = useState<ClientContractAcceptResult | null>(null);
  const [balancePaymentOption, setBalancePaymentOption] = useState<BalancePaymentOption | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const skipNextDraftSaveRef = useRef(false);
  const lastCepLookupRef = useRef("");
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const activeTerms = useMemo(
    () => config.acceptanceTerms.filter((term) => term.active && term.showInForm !== false),
    [config.acceptanceTerms],
  );

  useEffect(() => {
    setTermResponses((previous) => ({
      ...buildDefaultTermResponses(activeTerms),
      ...Object.fromEntries(
        Object.entries(previous).filter(([termId]) => activeTerms.some((term) => term.id === termId)),
      ),
    }));
  }, [activeTerms]);

  useEffect(() => {
    skipNextDraftSaveRef.current = true;
    const draft = loadClientContractFormDraft(config.tenantSlug);

    if (draft) {
      setFieldValues(draft.fieldValues);
      setSelectedPackageId(draft.selectedPackageId);
      setAdditionalSelections(new Map(draft.additionalSelections));
      setBalancePaymentOption(draft.balancePaymentOption);
      setTermResponses({
        ...buildDefaultTermResponses(activeTerms),
        ...draft.termResponses,
      });
      setCurrentSectionIndex(draft.currentSectionIndex);
    }

    setDraftHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hidrata rascunho apenas ao trocar o espaço
  }, [config.tenantSlug]);

  const additionalSelectionsKey = useMemo(
    () => JSON.stringify([...additionalSelections.entries()].sort(([a], [b]) => a.localeCompare(b))),
    [additionalSelections],
  );

  useEffect(() => {
    if (!draftHydrated || step !== "form") return;
    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveClientContractFormDraft(config.tenantSlug, {
        additionalSelections: [...additionalSelections.entries()],
        balancePaymentOption,
        currentSectionIndex,
        fieldValues: omitCalculatedClosingFormFieldValues(fieldValues, config.fields),
        selectedPackageId,
        termResponses,
      });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [
    additionalSelectionsKey,
    balancePaymentOption,
    config.tenantSlug,
    currentSectionIndex,
    draftHydrated,
    fieldValues,
    selectedPackageId,
    step,
    termResponses,
  ]);

  const activeFields = useMemo(
    () =>
      config.fields
        .filter((field) => field.active)
        .filter((field) => isClientFacingClosingFormField(field))
        .filter((field) => isClosingFormFieldApplicableToPackage(field, selectedPackageId))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [config.fields, selectedPackageId],
  );

  const fieldIdByKey = useMemo(() => buildFieldIdByKey(activeFields), [activeFields]);

  const allFieldIdByKey = useMemo(
    () => buildFieldIdByKey(config.fields.filter((field) => field.active)),
    [config.fields],
  );

  const packagesPricingKey = useMemo(
    () =>
      JSON.stringify({
        additionals: config.additionals.map((item) => ({
          id: item.id,
          price: item.price,
          type: item.type,
        })),
        packages: config.packages.map((pkg) => ({
          id: pkg.id,
          pricingSchedule: pkg.pricingSchedule,
          pricingTiers: pkg.pricingTiers,
        })),
      }),
    [config.additionals, config.packages],
  );

  const pricingInputKey = useMemo(() => {
    const guestFieldId = allFieldIdByKey.get("quantidade_convidados");
    const dateFieldId = allFieldIdByKey.get("data_evento");

    return JSON.stringify({
      additionalSelectionsKey,
      eventDate: dateFieldId ? (fieldValues[dateFieldId] ?? "") : "",
      guestCount: guestFieldId ? (fieldValues[guestFieldId] ?? "") : "",
      packagesPricingKey,
      selectedPackageId,
    });
  }, [
    additionalSelectionsKey,
    allFieldIdByKey,
    fieldValues,
    packagesPricingKey,
    selectedPackageId,
  ]);

  const paymentSummaryValues = useMemo(
    () =>
      computeClosingFormPaymentSummary({
        additionalSelections,
        additionals: config.additionals,
        fieldIdByKey: allFieldIdByKey,
        fieldValues,
        guestCountSource: EMPTY_EVENTO,
        packages: config.packages,
        selectedPackageId,
      }),
    [additionalSelections, allFieldIdByKey, config.additionals, config.packages, fieldValues, selectedPackageId],
  );

  const fieldsBySection = useMemo(() => {
    const grouped = new Map<ClosingFormSection, ClosingFormField[]>();
    PUBLIC_FORM_SECTIONS.forEach((section) => grouped.set(section, []));

    activeFields.forEach((field) => {
      const sectionFields = grouped.get(field.section) ?? [];
      sectionFields.push(field);
      grouped.set(field.section, sectionFields);
    });

    return grouped;
  }, [activeFields]);

  const depositMethods = useMemo(
    () => config.paymentMethods.filter((method) => method.allowedForDeposit),
    [config.paymentMethods],
  );

  const applicableAdditionals = useMemo(
    () =>
      config.additionals.filter((item) =>
        isAdditionalApplicableToPackage(item, selectedPackageId),
      ),
    [config.additionals, selectedPackageId],
  );

  const maxGuestCount = useMemo(
    () => resolveMaxGuestCount(config.maxVenueGuestCapacity, config.packages),
    [config.maxVenueGuestCapacity, config.packages],
  );

  const guestCountOptions = useMemo(
    () => buildGuestCountOptions(maxGuestCount),
    [maxGuestCount],
  );

  const guestCountHelperText = useMemo(
    () => buildGuestCountHelperText(maxGuestCount),
    [maxGuestCount],
  );

  useEffect(() => {
    if (!draftHydrated) return;

    const guestFieldId = fieldIdByKey.get("quantidade_convidados");
    if (!guestFieldId) return;

    const current = fieldValues[guestFieldId];
    if (!current) return;

    const normalized = normalizeGuestCountValue(current, maxGuestCount);
    if (normalized === current) return;

    setFieldValues((previous) => ({ ...previous, [guestFieldId]: normalized }));
  }, [draftHydrated, fieldIdByKey, fieldValues, maxGuestCount]);

  useEffect(() => {
    if (!draftHydrated) return;

    setFieldValues((previous) =>
      recalculateClosingFormFinancials({
        additionalSelections,
        additionals: config.additionals,
        fieldIdByKey: allFieldIdByKey,
        fieldValues: previous,
        guestCountSource: EMPTY_EVENTO,
        packages: config.packages,
        selectedPackageId,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcula preços quando entradas de precificação mudam
  }, [draftHydrated, pricingInputKey]);

  const syncFinancialFields = (nextValues: Record<string, string>, pacoteValue?: number) =>
    recalculateFinancialTotals(nextValues, fieldIdByKey, { pacoteValue });

  const resolveSelectedPackage = () =>
    config.packages.find((pkg) => pkg.id === selectedPackageId) ?? null;

  const resolvePacoteValue = (
    values: Record<string, string>,
    pkg: PackageData | null = resolveSelectedPackage(),
  ) => {
    if (!pkg) return undefined;
    const guestCount = resolveGuestCount(EMPTY_EVENTO, values, fieldIdByKey);
    const eventDate = resolveEventDateFromFieldValues(values, fieldIdByKey);
    return resolvePackagePrice(pkg, guestCount, eventDate);
  };

  const refreshPackagePricing = (
    values: Record<string, string>,
    pkg: PackageData,
  ): Record<string, string> => {
    const guestCount = resolveGuestCount(EMPTY_EVENTO, values, fieldIdByKey);
    return applyPackageToFieldValues(pkg, guestCount, values, fieldIdByKey);
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    setFieldValues((previous) => {
      let next = { ...previous, [fieldId]: value };
      const changedField = activeFields.find((field) => field.id === fieldId);

      if (
        changedField?.fieldKey === "quantidade_convidados" ||
        changedField?.fieldKey === "data_evento"
      ) {
        const pkg = resolveSelectedPackage();
        if (pkg) {
          next = refreshPackagePricing(next, pkg);
        }
      }

      return syncFinancialFields(next, resolvePacoteValue(next));
    });

    setErrors((previous) => {
      if (!previous[fieldId]) return previous;
      const next = { ...previous };
      delete next[fieldId];
      return next;
    });
  };

  const applyAddressFields = (address: {
    bairro: string;
    cep: string;
    cidade: string;
    estado: string;
    rua: string;
  }) => {
    const addressByKey: Array<[string, string]> = [
      ["cliente_cep", formatCepInput(address.cep)],
      ["cliente_rua", address.rua],
      ["cliente_bairro", address.bairro],
      ["cliente_cidade", address.cidade],
      ["cliente_estado", address.estado],
    ];

    setFieldValues((previous) => {
      const next = { ...previous };

      addressByKey.forEach(([fieldKey, fieldValue]) => {
        const targetFieldId = fieldIdByKey.get(fieldKey);
        if (targetFieldId) {
          next[targetFieldId] = fieldValue;
        }
      });

      return syncFinancialFields(next, resolvePacoteValue(next));
    });

    setErrors((previous) => {
      const next = { ...previous };
      addressByKey.forEach(([fieldKey]) => {
        const targetFieldId = fieldIdByKey.get(fieldKey);
        if (targetFieldId) delete next[targetFieldId];
      });
      return next;
    });
  };

  const lookupAddressByCep = async (cep: string) => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8 || digits === lastCepLookupRef.current) return;

    lastCepLookupRef.current = digits;
    setIsFetchingCep(true);

    try {
      const address = await fetchAddressByCep(digits);
      if (!address) {
        lastCepLookupRef.current = "";
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      applyAddressFields(address);
    } catch {
      lastCepLookupRef.current = "";
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível consultar o endereço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleCepFieldChange = (fieldId: string, rawValue: string) => {
    const formatted = formatCepInput(rawValue);
    updateFieldValue(fieldId, formatted);

    if (!isValidCep(formatted)) {
      lastCepLookupRef.current = "";
      return;
    }

    void lookupAddressByCep(formatted);
  };

  const handleSelectPackage = (pkg: PackageData) => {
    setSelectedPackageId(pkg.id);
    const guestCount = resolveGuestCount(EMPTY_EVENTO, fieldValues, fieldIdByKey);

    setAdditionalSelections((previous) => {
      const next = new Map(
        [...previous.entries()].filter(([id]) =>
          isAdditionalApplicableToPackage(
            config.additionals.find((item) => item.id === id) ?? { packageIds: [] },
            pkg.id,
          ),
        ),
      );

      const snapshot = buildAdicionaisSnapshot(config.additionals, next, guestCount);
      const total = getAdditionalsTotal(snapshot);

      setFieldValues((fieldPrevious) => {
        const withPackage = refreshPackagePricing(fieldPrevious, pkg);
        const eventDate = resolveEventDateFromFieldValues(withPackage, fieldIdByKey);
        const pacoteValue = resolvePackagePrice(pkg, guestCount, eventDate);
        const fieldNext = syncFinancialFields(withPackage, pacoteValue);
        const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
        const adicionaisSelecionadosId = fieldIdByKey.get("adicionais_selecionados");
        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(total);
        if (adicionaisSelecionadosId) {
          fieldNext[adicionaisSelecionadosId] = formatAdicionaisSelecionadosLabel(snapshot);
        }

        config.fields.forEach((field) => {
          if (
            !field.isSystem &&
            !isClosingFormFieldApplicableToPackage(field, pkg.id) &&
            fieldNext[field.id]
          ) {
            delete fieldNext[field.id];
          }
        });

        return fieldNext;
      });

      return next;
    });
  };

  const toggleAdditional = (additionalId: string) => {
    setAdditionalSelections((previous) => {
      const next = new Map(previous);
      if (next.has(additionalId)) next.delete(additionalId);
      else next.set(additionalId, 1);

      const guestCount = resolveGuestCount(EMPTY_EVENTO, fieldValues, fieldIdByKey);
      const snapshot = buildAdicionaisSnapshot(config.additionals, next, guestCount);
      const total = getAdditionalsTotal(snapshot);

      setFieldValues((fieldPrevious) => {
        const fieldNext = { ...fieldPrevious };
        const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
        const adicionaisSelecionadosId = fieldIdByKey.get("adicionais_selecionados");
        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(total);
        if (adicionaisSelecionadosId) {
          fieldNext[adicionaisSelecionadosId] = formatAdicionaisSelecionadosLabel(snapshot);
        }
        return syncFinancialFields(fieldNext, resolvePacoteValue(fieldNext));
      });

      return next;
    });
  };

  const updateAdditionalQuantity = (additionalId: string, quantity: number) => {
    const qty = Math.max(quantity, 1);
    setAdditionalSelections((previous) => {
      const next = new Map(previous);
      if (!next.has(additionalId)) return previous;
      next.set(additionalId, qty);

      const guestCount = resolveGuestCount(EMPTY_EVENTO, fieldValues, fieldIdByKey);
      const snapshot = buildAdicionaisSnapshot(config.additionals, next, guestCount);
      const total = getAdditionalsTotal(snapshot);

      setFieldValues((fieldPrevious) => {
        const fieldNext = { ...fieldPrevious };
        const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
        const adicionaisSelecionadosId = fieldIdByKey.get("adicionais_selecionados");
        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(total);
        if (adicionaisSelecionadosId) {
          fieldNext[adicionaisSelecionadosId] = formatAdicionaisSelecionadosLabel(snapshot);
        }
        return syncFinancialFields(fieldNext, resolvePacoteValue(fieldNext));
      });

      return next;
    });
  };

  const shouldShowSection = (section: ClosingFormSection) => {
    const sectionFields = fieldsBySection.get(section) ?? [];
    if (sectionFields.length > 0) return true;

    switch (section) {
      case "pacote":
        return config.packages.length > 0;
      case "adicionais":
        return applicableAdditionals.length > 0;
      case "pagamento":
        return filterClientVisiblePaymentFields(sectionFields).length > 0;
      case "aceites":
        return activeTerms.length > 0;
      default:
        return false;
    }
  };

  const visibleSections = PUBLIC_FORM_SECTIONS.filter(shouldShowSection);

  const validatePhoneFieldValue = (field: ClosingFormField, value: string): string | null => {
    if (field.fieldType !== "phone" && field.fieldKey !== "cliente_telefone") return null;
    if (!field.required && !value) return null;
    if (!value) return "Este campo é obrigatório.";

    return getBrazilMobilePhoneValidationError(value);
  };

  const shouldSkipClientFieldValidation = (field: ClosingFormField): boolean =>
    Boolean(
      field.fieldKey &&
        (CALCULATED_CLOSING_FORM_FIELD_KEYS.has(field.fieldKey) ||
          isClientPaymentSummaryFieldKey(field.fieldKey) ||
          isHiddenPackageFieldKey(field.fieldKey)),
    );

  const resolveBalanceSaldo = (): number => {
    const saldoFieldId = allFieldIdByKey.get("valor_saldo");
    if (saldoFieldId) {
      const value = Number(fieldValues[saldoFieldId] ?? 0);
      if (Number.isFinite(value)) return Math.max(value, 0);
    }

    const entradaFieldId = allFieldIdByKey.get("valor_entrada");
    const entrada = entradaFieldId ? Number(fieldValues[entradaFieldId] ?? 0) : 0;
    return Math.max(paymentSummaryValues.totalValue - (Number.isFinite(entrada) ? entrada : 0), 0);
  };

  const appendBalancePaymentValidation = (nextErrors: Record<string, string>) => {
    const saldoFieldId = allFieldIdByKey.get("valor_saldo");
    if (!saldoFieldId || resolveBalanceSaldo() <= 0 || balancePaymentOption) return;
    nextErrors.balancePaymentOption = "Selecione como deseja pagar o saldo restante.";
  };

  const validateFields = (fields: ClosingFormField[]) => {
    const nextErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (shouldSkipClientFieldValidation(field)) return;

      const value = fieldValues[field.id]?.trim() ?? "";

      if (field.fieldKey === "quantidade_convidados") {
        if (!field.required && !value) return;
        const guestError = validateGuestCountValue(value, maxGuestCount);
        if (guestError) nextErrors[field.id] = guestError;
        return;
      }

      const phoneError = validatePhoneFieldValue(field, value);
      if (phoneError) {
        nextErrors[field.id] = phoneError;
        return;
      }

      if (!field.required) return;

      if (field.fieldType === "checkbox" || field.fieldType === "acceptance") {
        if (value !== "true") nextErrors[field.id] = "Confirme este item para continuar.";
        return;
      }

      if (!value) nextErrors[field.id] = "Este campo é obrigatório.";
    });

    return nextErrors;
  };

  const getSectionValidationErrors = (section: ClosingFormSection) => {
    const nextErrors: Record<string, string> = {};

    if (section === "pacote") {
      const pacoteNomeField = activeFields.find((field) => field.fieldKey === PACKAGE_SELECTOR_FIELD_KEY);
      if (pacoteNomeField?.required && config.packages.length > 0 && !selectedPackageId) {
        nextErrors.pacote = "Selecione um pacote para continuar.";
      }
    }

    if (section === "aceites") {
      Object.assign(nextErrors, validateAcceptanceTermResponses(activeTerms, termResponses));
    }

    const sectionFields = (fieldsBySection.get(section) ?? []).filter(
      (field) => field.fieldKey !== PACKAGE_SELECTOR_FIELD_KEY,
    );

    if (section === "pagamento") {
      Object.assign(
        nextErrors,
        validateFields(
          filterClientVisiblePaymentFields(sectionFields).filter(
            (field) => !isClientPaymentSummaryFieldKey(field.fieldKey),
          ),
        ),
      );
      appendBalancePaymentValidation(nextErrors);
    } else if (section !== "pacote" && section !== "adicionais" && section !== "aceites") {
      Object.assign(nextErrors, validateFields(sectionFields));
    }

    return nextErrors;
  };

  const collectFullValidationErrors = () => {
    const nextErrors: Record<string, string> = {};
    visibleSections.forEach((section) => {
      Object.assign(nextErrors, getSectionValidationErrors(section));
    });
    return nextErrors;
  };

  const findFirstSectionIndexWithErrors = (validationErrors: Record<string, string>) => {
    for (let index = 0; index < visibleSections.length; index += 1) {
      const section = visibleSections[index];

      if (section === "pacote" && validationErrors.pacote) return index;
      if (
        section === "aceites" &&
        Object.keys(validationErrors).some((key) => key.startsWith("term-"))
      ) {
        return index;
      }
      if (section === "pagamento" && validationErrors.balancePaymentOption) return index;

      const sectionFieldIds = new Set(
        (fieldsBySection.get(section) ?? [])
          .filter((field) => field.fieldKey !== PACKAGE_SELECTOR_FIELD_KEY)
          .map((field) => field.id),
      );

      if (Object.keys(validationErrors).some((key) => sectionFieldIds.has(key))) {
        return index;
      }
    }

    return -1;
  };

  const applyValidationErrors = (validationErrors: Record<string, string>) => {
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) return true;

    const sectionIndex = findFirstSectionIndexWithErrors(validationErrors);
    if (sectionIndex >= 0) {
      setCurrentSectionIndex(sectionIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    toast({
      title: "Campos pendentes",
      description: "Revise os campos destacados antes de continuar para o contrato.",
      variant: "destructive",
    });
    return false;
  };

  const validateSection = (section: ClosingFormSection) => {
    const nextErrors = getSectionValidationErrors(section);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validate = () => applyValidationErrors(collectFullValidationErrors());

  useEffect(() => {
    if (currentSectionIndex >= visibleSections.length && visibleSections.length > 0) {
      setCurrentSectionIndex(visibleSections.length - 1);
    }
  }, [currentSectionIndex, visibleSections.length]);

  const currentSection = visibleSections[currentSectionIndex] ?? null;
  const isLastSection =
    visibleSections.length > 0 && currentSectionIndex === visibleSections.length - 1;

  const handleContinueSection = () => {
    if (!currentSection || !validateSection(currentSection)) return;

    if (!isLastSection) {
      setCurrentSectionIndex((index) => index + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackSection = () => {
    setCurrentSectionIndex((index) => Math.max(0, index - 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const guestCount = resolveGuestCount(EMPTY_EVENTO, fieldValues, fieldIdByKey);
    const selectedPackage = resolveSelectedPackage();
    const adicionaisSnapshot = buildAdicionaisSnapshot(
      config.additionals,
      additionalSelections,
      guestCount,
    );
    const adicionaisSelecionadosId = allFieldIdByKey.get("adicionais_selecionados");
    const submitFieldValues = { ...fieldValues };
    if (adicionaisSelecionadosId) {
      submitFieldValues[adicionaisSelecionadosId] =
        formatAdicionaisSelecionadosLabel(adicionaisSnapshot);
    }

    const adicionaisSelecionadosField = config.fields.find(
      (field) => field.active && field.fieldKey === "adicionais_selecionados",
    );
    const submitFields =
      adicionaisSelecionadosField &&
      !activeFields.some((field) => field.id === adicionaisSelecionadosField.id)
        ? [...activeFields, adicionaisSelecionadosField]
        : activeFields;

    try {
      const result = await submitForm.mutateAsync({
        acceptanceResponses: buildAcceptanceResponsesPayload(activeTerms, termResponses),
        adicionaisSnapshot,
        fieldValues: submitFieldValues,
        fields: submitFields.map((field) => ({
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          id: field.id,
          required: field.required,
        })),
        pacoteId: selectedPackageId ? Number(selectedPackageId) : null,
        packageEventoUpdates: selectedPackage
          ? buildPackageEventoUpdates(
              selectedPackage,
              guestCount,
              resolveEventDateFromFieldValues(fieldValues, fieldIdByKey),
            )
          : undefined,
        tenantSlug: config.tenantSlug,
        balancePaymentSchedule: balancePaymentOption,
      });

      setSubmitResult(result);
      clearClientContractFormDraft(config.tenantSlug);
      setStep("contract");
      onSuccess?.(result);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Não foi possível enviar o formulário.",
      });
    }
  };

  const renderFieldInput = (field: ClosingFormField) => {
    const value = fieldValues[field.id] ?? "";
    const isReadOnlyTotal = field.fieldKey === "valor_total" || field.fieldKey === "valor_saldo";
    const fieldConfig = parseFieldConfig(field.config);

    if (field.fieldKey === "forma_pagamento_entrada") {
      return (
        <Select value={value || undefined} onValueChange={(next) => updateFieldValue(field.id, next)}>
          <SelectTrigger id={`client-field-${field.id}`} className="text-sm">
            <SelectValue placeholder="Selecione o método da entrada" />
          </SelectTrigger>
          <SelectContent>
            {depositMethods.map((method) => (
              <SelectItem key={method.id} value={method.name}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.fieldType === "textarea") {
      return (
        <Textarea
          id={`client-field-${field.id}`}
          value={value}
          onChange={(event) => updateFieldValue(field.id, event.target.value)}
          className="text-sm"
        />
      );
    }

    if (field.fieldType === "checkbox" || field.fieldType === "acceptance") {
      return (
        <label className="flex items-start gap-2 text-sm text-foreground">
          <Checkbox
            checked={value === "true"}
            onCheckedChange={(checked) => updateFieldValue(field.id, checked === true ? "true" : "")}
            className="mt-0.5"
          />
          <span>{field.description ?? field.label}</span>
        </label>
      );
    }

    if (field.fieldType === "select") {
      const options = fieldConfig.options ?? [];
      if (options.length === 0) {
        return <p className="text-xs text-muted-foreground">Nenhuma opção configurada.</p>;
      }
      return (
        <Select value={value || undefined} onValueChange={(next) => updateFieldValue(field.id, next)}>
          <SelectTrigger id={`client-field-${field.id}`} className="text-sm">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.fieldType === "multiselect") {
      const options = fieldConfig.options ?? [];
      const selected = value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      return (
        <div className="space-y-2">
          {options.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhuma opção configurada.</p>
          )}
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option);
                  updateFieldValue(field.id, next.join(", "));
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (field.fieldKey === "cliente_cpf") {
      return (
        <Input
          id={`client-field-${field.id}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          value={formatCpfInput(value)}
          placeholder="000.000.000-00"
          onChange={(event) => updateFieldValue(field.id, formatCpfInput(event.target.value))}
          className="text-sm"
        />
      );
    }

    if (field.fieldKey === "cliente_cep") {
      return (
        <div className="relative">
          <Input
            id={`client-field-${field.id}`}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            value={formatCepInput(value)}
            placeholder="00000-000"
            onChange={(event) => handleCepFieldChange(field.id, event.target.value)}
            className="text-sm pr-9"
          />
          {isFetchingCep ? (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>
      );
    }

    if (field.fieldKey === "quantidade_convidados") {
      return (
        <div className="space-y-1.5">
          <Select
            value={value || undefined}
            onValueChange={(next) => updateFieldValue(field.id, next)}
          >
            <SelectTrigger id={`client-field-${field.id}`} className="text-sm">
              <SelectValue placeholder="Selecione a quantidade" />
            </SelectTrigger>
            <SelectContent>
              {guestCountOptions.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} convidados
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{guestCountHelperText}</p>
        </div>
      );
    }

    if (isReadOnlyTotal) {
      const numericValue = Number(value);
      return (
        <Input
          id={`client-field-${field.id}`}
          type="text"
          value={Number.isFinite(numericValue) ? formatCurrency(numericValue) : ""}
          readOnly
          className="text-sm bg-muted/30"
        />
      );
    }

    if (field.fieldType === "currency") {
      const numericValue = Number(value);
      return (
        <CurrencyInput
          id={`client-field-${field.id}`}
          value={Number.isFinite(numericValue) ? numericValue : 0}
          onChange={(next) => updateFieldValue(field.id, next > 0 ? String(next) : "")}
          placeholder="R$ 0,00"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      );
    }

    if (field.fieldType === "phone" || field.fieldKey === "cliente_telefone") {
      return (
        <PhoneInput
          id={`client-field-${field.id}`}
          value={value}
          onChange={(nextValue) => updateFieldValue(field.id, nextValue)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      );
    }

    return (
      <Input
        id={`client-field-${field.id}`}
        type={
          field.fieldType === "number"
            ? "number"
            : field.fieldType === "date"
              ? "date"
              : field.fieldType === "time"
                ? "time"
                : field.fieldType === "email"
                  ? "email"
                  : "text"
        }
        value={value}
        min={field.fieldType === "number" ? "0" : undefined}
        onChange={(event) => updateFieldValue(field.id, event.target.value)}
        className="text-sm"
      />
    );
  };

  const renderFormField = (field: ClosingFormField) => (
    <div key={field.id} className="space-y-1.5">
      {field.fieldType !== "checkbox" && field.fieldType !== "acceptance" && (
        <Label htmlFor={`client-field-${field.id}`} className="text-xs">
          {field.label}
          {field.required ? " *" : ""}
        </Label>
      )}
      {renderFieldInput(field)}
      {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
    </div>
  );

  const renderFormFields = (fields: ClosingFormField[]) =>
    fields
      .filter((field) => !isHiddenPackageFieldKey(field.fieldKey))
      .map((field) => renderFormField(field));

  const renderPaymentFormFields = (fields: ClosingFormField[]) =>
    fields
      .filter((field) => !isHiddenPackageFieldKey(field.fieldKey))
      .map((field) => (
        <Fragment key={field.id}>
          {renderFormField(field)}
          {field.fieldKey === "valor_saldo" && (
            <ClientBalancePaymentOptions
              value={balancePaymentOption}
              onChange={(next) => {
                setBalancePaymentOption(next);
                if (errors.balancePaymentOption) {
                  setErrors((previous) => {
                    const updated = { ...previous };
                    delete updated.balancePaymentOption;
                    return updated;
                  });
                }
              }}
              error={errors.balancePaymentOption}
            />
          )}
        </Fragment>
      ));

  const renderSectionContent = (section: ClosingFormSection) => (
    <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-4">
      {section === "pacote" && config.packages.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="client-package-select" className="text-xs">
            Pacote contratado *
          </Label>
          <Select
            value={selectedPackageId ?? undefined}
            onValueChange={(packageId) => {
              const pkg = config.packages.find((item) => item.id === packageId);
              if (pkg) handleSelectPackage(pkg);
            }}
          >
            <SelectTrigger id="client-package-select" className="text-sm">
              <SelectValue placeholder="Selecione um pacote" />
            </SelectTrigger>
            <SelectContent>
              {config.packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.pacote && <p className="text-xs text-destructive">{errors.pacote}</p>}
        </div>
      )}

      {section === "adicionais" && applicableAdditionals.length > 0 && (
        <AdditionalSelectionList
          items={applicableAdditionals}
          selections={additionalSelections}
          onToggle={toggleAdditional}
          onQuantityChange={updateAdditionalQuantity}
        />
      )}

      {section === "aceites" &&
        activeTerms.map((term) => (
          <AcceptanceTermResponseField
            key={term.id}
            term={term}
            response={termResponses[term.id]}
            error={errors[`term-${term.id}`]}
            onResponseChange={(termId, accepted) => {
              setTermResponses((previous) => setTermResponse(previous, termId, accepted));
              setErrors((previous) => {
                if (!previous[`term-${termId}`]) return previous;
                const next = { ...previous };
                delete next[`term-${termId}`];
                return next;
              });
            }}
          />
        ))}

      {section === "pagamento" && (
        <>
          <ClientPaymentValueSummary
            additionalSelectionCount={additionalSelections.size}
            fieldIdByKey={allFieldIdByKey}
            values={paymentSummaryValues}
          />
          {renderPaymentFormFields(
            filterClientVisiblePaymentFields(
              (fieldsBySection.get(section) ?? []).filter(
                (field) =>
                  field.fieldKey !== PACKAGE_SELECTOR_FIELD_KEY &&
                  !isClientPaymentSummaryFieldKey(field.fieldKey),
              ),
            ),
          )}
        </>
      )}

      {section !== "pacote" &&
        section !== "adicionais" &&
        section !== "aceites" &&
        section !== "pagamento" &&
        renderFormFields(
          filterClientVisiblePaymentFields(
            (fieldsBySection.get(section) ?? []).filter(
              (field) => field.fieldKey !== PACKAGE_SELECTOR_FIELD_KEY,
            ),
          ),
        )}
    </div>
  );

  const currentSectionGuide = currentSection ? getClientFormSectionGuide(currentSection) : null;

  if (step === "done" && acceptResult) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-3">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="text-xl font-semibold text-foreground">Contrato assinado!</h2>
        <p className="text-sm text-muted-foreground">{acceptResult.message}</p>
      </div>
    );
  }

  if (step === "contract" && submitResult) {
    return (
      <ClientContractSigningStep
        submitResult={submitResult}
        tenantSlug={config.tenantSlug}
        onSuccess={(result) => {
          clearClientContractFormDraft(config.tenantSlug);
          setAcceptResult(result);
          setStep("done");
        }}
      />
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/40 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-lg font-semibold text-foreground">
              Formulário de contratação — {config.tenantName}
            </h1>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground max-w-2xl">
            <p>🎉 Vamos planejar juntos a sua festa dos sonhos!</p>
            <p>
              Para que tudo saia exatamente como você imaginou, criamos este formulário. Ele vai nos
              ajudar a cuidar de cada detalhe e garantir que sua festa seja inesquecível.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {visibleSections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Este espaço ainda não publicou campos no formulário.
            </p>
          )}

          {currentSection && currentSectionGuide && (
            <section className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    Etapa {currentSectionIndex + 1} de {visibleSections.length}
                  </span>
                  <span className="font-medium text-foreground">{currentSectionGuide.title}</span>
                </div>
                <div className="flex gap-1.5">
                  {visibleSections.map((section, index) => (
                    <div
                      key={section}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        index <= currentSectionIndex ? "bg-primary" : "bg-muted",
                      )}
                      aria-hidden
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">{currentSectionGuide.title}</h2>
                {currentSectionGuide.description && (
                  <p className="text-sm text-muted-foreground">{currentSectionGuide.description}</p>
                )}
              </div>

              {renderSectionContent(currentSection)}
            </section>
          )}

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          {visibleSections.length > 0 && (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="gap-2 sm:w-auto"
                disabled={currentSectionIndex === 0}
                onClick={handleBackSection}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Voltar
              </Button>

              {isLastSection ? (
                <Button type="submit" className="w-full sm:w-auto" disabled={submitForm.isPending}>
                  {submitForm.isPending ? "Enviando..." : "Continuar para o contrato"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={handleContinueSection}
                >
                  Continuar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
