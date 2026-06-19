import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  additionalBillingTypeLabels,
  additionalCategoryLabels,
  isAdditionalApplicableToPackage,
  type PackageData,
} from "@/data/packagesData";
import {
  closingFormSectionLabels,
  installmentLimitModeLabels,
  parseFieldConfig,
  type ClosingFormField,
  type ClosingFormSection,
} from "@/features/configuracoes";
import {
  applyPackageToFieldValues,
  buildAdicionaisSnapshot,
  buildFieldIdByKey,
  buildPackageEventoUpdates,
  getAdditionalsTotal,
  getPackageFromPrice,
  getPackagePriceForGuests,
  isClosingFormFieldApplicableToPackage,
  isHiddenPackageFieldKey,
  PACKAGE_SELECTOR_FIELD_KEY,
  recalculateFinancialTotals,
  resolveGuestCount,
} from "@/features/eventos/closing-form-runtime";
import type { Evento } from "@/features/eventos/types";
import {
  PUBLIC_FORM_SECTIONS,
  type ClientContractAcceptResult,
  type ClientContractFormConfig,
  type ClientContractFormSubmitResult,
  useSubmitClientContractForm,
} from "@/features/public-contract-form";
import { cn } from "@/lib/utils";

import { ClientContractSigningStep } from "./ClientContractSigningStep";

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
  const [acceptedTermIds, setAcceptedTermIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<ClientFormStep>("form");
  const [submitResult, setSubmitResult] = useState<ClientContractFormSubmitResult | null>(null);
  const [acceptResult, setAcceptResult] = useState<ClientContractAcceptResult | null>(null);

  const activeFields = useMemo(
    () =>
      config.fields
        .filter((field) => field.active)
        .filter((field) => isClosingFormFieldApplicableToPackage(field, selectedPackageId))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [config.fields, selectedPackageId],
  );

  const fieldIdByKey = useMemo(() => buildFieldIdByKey(activeFields), [activeFields]);

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

  const activeTerms = useMemo(
    () => config.acceptanceTerms.filter((term) => term.active && term.showInForm !== false),
    [config.acceptanceTerms],
  );

  const depositMethods = useMemo(
    () => config.paymentMethods.filter((method) => method.allowedForDeposit),
    [config.paymentMethods],
  );

  const balanceMethods = useMemo(
    () => config.paymentMethods.filter((method) => method.allowedForRemainingBalance),
    [config.paymentMethods],
  );

  const applicableAdditionals = useMemo(
    () =>
      config.additionals.filter((item) =>
        isAdditionalApplicableToPackage(item, selectedPackageId),
      ),
    [config.additionals, selectedPackageId],
  );

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
    return guestCount > 0 ? getPackagePriceForGuests(pkg, guestCount) : getPackageFromPrice(pkg);
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    setFieldValues((previous) => {
      let next = { ...previous, [fieldId]: value };
      const changedField = activeFields.find((field) => field.id === fieldId);

      if (changedField?.fieldKey === "quantidade_convidados") {
        const pkg = resolveSelectedPackage();
        if (pkg) {
          const guestCount = Number(value) || 0;
          next = applyPackageToFieldValues(pkg, guestCount, next, fieldIdByKey);
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
        const withPackage = applyPackageToFieldValues(pkg, guestCount, fieldPrevious, fieldIdByKey);
        const pacoteValue =
          guestCount > 0 ? getPackagePriceForGuests(pkg, guestCount) : getPackageFromPrice(pkg);
        const fieldNext = syncFinancialFields(withPackage, pacoteValue);
        const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(total);

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
        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(total);
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
        return config.paymentMethods.length > 0 || Boolean(config.financialSettings);
      case "aceites":
        return activeTerms.length > 0;
      default:
        return false;
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    activeFields.forEach((field) => {
      if (!field.required) return;
      const value = fieldValues[field.id]?.trim() ?? "";

      if (field.fieldType === "checkbox" || field.fieldType === "acceptance") {
        if (value !== "true") nextErrors[field.id] = "Confirme este item para continuar.";
        return;
      }

      if (!value) nextErrors[field.id] = "Este campo é obrigatório.";
    });

    const pacoteNomeField = activeFields.find((field) => field.fieldKey === PACKAGE_SELECTOR_FIELD_KEY);
    if (pacoteNomeField?.required && config.packages.length > 0 && !selectedPackageId) {
      nextErrors.pacote = "Selecione um pacote para continuar.";
    }

    activeTerms.forEach((term) => {
      if (term.isRequired && !acceptedTermIds.has(term.id)) {
        nextErrors[`term-${term.id}`] = "Este aceite é obrigatório.";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const guestCount = resolveGuestCount(EMPTY_EVENTO, fieldValues, fieldIdByKey);
    const selectedPackage = resolveSelectedPackage();
    const adicionaisSnapshot = buildAdicionaisSnapshot(
      config.additionals,
      additionalSelections,
      guestCount,
    );

    try {
      const result = await submitForm.mutateAsync({
        acceptanceResponses: activeTerms
          .filter((term) => acceptedTermIds.has(term.id))
          .map((term) => ({
            accepted: true,
            termId: Number(term.id),
          })),
        adicionaisSnapshot,
        fieldValues,
        fields: activeFields.map((field) => ({
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          id: field.id,
          required: field.required,
        })),
        pacoteId: selectedPackageId ? Number(selectedPackageId) : null,
        packageEventoUpdates: selectedPackage
          ? buildPackageEventoUpdates(selectedPackage, guestCount)
          : undefined,
        tenantSlug: config.tenantSlug,
      });

      setSubmitResult(result);
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

    if (field.fieldKey === "forma_pagamento_saldo") {
      return (
        <Select value={value || undefined} onValueChange={(next) => updateFieldValue(field.id, next)}>
          <SelectTrigger id={`client-field-${field.id}`} className="text-sm">
            <SelectValue placeholder="Selecione o método do saldo" />
          </SelectTrigger>
          <SelectContent>
            {balanceMethods.map((method) => (
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

    return (
      <Input
        id={`client-field-${field.id}`}
        type={
          field.fieldType === "currency" || field.fieldType === "number"
            ? "number"
            : field.fieldType === "date"
              ? "date"
              : field.fieldType === "time"
                ? "time"
                : field.fieldType === "email"
                  ? "email"
                  : field.fieldType === "phone"
                    ? "tel"
                    : "text"
        }
        value={value}
        readOnly={isReadOnlyTotal}
        min={field.fieldType === "number" || field.fieldType === "currency" ? "0" : undefined}
        step={field.fieldType === "currency" ? "0.01" : undefined}
        onChange={(event) => updateFieldValue(field.id, event.target.value)}
        className="text-sm"
      />
    );
  };

  const renderFormFields = (fields: ClosingFormField[]) =>
    fields
      .filter((field) => !isHiddenPackageFieldKey(field.fieldKey))
      .map((field) => (
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
      ));

  const visibleSections = PUBLIC_FORM_SECTIONS.filter(shouldShowSection);

  if (step === "done" && acceptResult) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-3">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="text-xl font-semibold text-foreground">Contrato assinado!</h2>
        <p className="text-sm text-muted-foreground">{acceptResult.message}</p>
        {acceptResult.advancedToFesta && (
          <p className="text-sm text-muted-foreground">
            Seu cadastro foi confirmado no funil Festa (Boas Vindas). Em breve você receberá nosso
            contato pelo WhatsApp.
          </p>
        )}
      </div>
    );
  }

  if (step === "contract" && submitResult) {
    return (
      <ClientContractSigningStep
        submitResult={submitResult}
        tenantSlug={config.tenantSlug}
        onSuccess={(result) => {
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
          <p className="text-sm text-muted-foreground max-w-2xl">
            Preencha com o mesmo telefone informado ao espaço. Usamos esse número para localizar seu
            cadastro no funil de Vendas. Após enviar, você verá o contrato gerado para leitura e
            assinatura eletrônica.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {visibleSections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Este espaço ainda não publicou campos no formulário.
            </p>
          )}

          {visibleSections.map((section) => (
            <section key={section} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground border-b border-border/30 pb-2">
                {closingFormSectionLabels[section]}
              </h2>
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

                {section === "adicionais" &&
                  applicableAdditionals.map((item) => {
                    const isSelected = additionalSelections.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 cursor-pointer",
                          isSelected ? "border-primary bg-primary/5" : "border-border/60",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleAdditional(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {additionalCategoryLabels[item.category]} ·{" "}
                            {additionalBillingTypeLabels[item.type]} · {formatCurrency(item.price)}
                          </p>
                        </div>
                      </label>
                    );
                  })}

                {section === "aceites" &&
                  activeTerms.map((term) => (
                    <label
                      key={term.id}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3 cursor-pointer"
                    >
                      <Checkbox
                        checked={acceptedTermIds.has(term.id)}
                        onCheckedChange={() => {
                          setAcceptedTermIds((previous) => {
                            const next = new Set(previous);
                            if (next.has(term.id)) next.delete(term.id);
                            else next.add(term.id);
                            return next;
                          });
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium">
                          {term.title}
                          {term.isRequired ? " *" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{term.content}</p>
                        {errors[`term-${term.id}`] && (
                          <p className="text-xs text-destructive">{errors[`term-${term.id}`]}</p>
                        )}
                      </div>
                    </label>
                  ))}

                {section !== "pacote" &&
                  section !== "adicionais" &&
                  section !== "aceites" &&
                  renderFormFields(
                    (fieldsBySection.get(section) ?? []).filter(
                      (field) => field.fieldKey !== PACKAGE_SELECTOR_FIELD_KEY,
                    ),
                  )}

                {section === "pagamento" && config.financialSettings && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground text-sm">Regras financeiras</p>
                    <p>Parcelas máximas: {config.financialSettings.max_installments}</p>
                    <p>
                      {installmentLimitModeLabels[config.financialSettings.installment_limit_mode]}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ))}

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          {visibleSections.length > 0 && (
            <Button type="submit" className="w-full sm:w-auto" disabled={submitForm.isPending}>
              {submitForm.isPending ? "Enviando..." : "Continuar para o contrato"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
