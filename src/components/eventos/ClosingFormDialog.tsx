import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileCheck2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/data/packagesData";
import type { PackageData } from "@/data/packagesData";
import {
  ClosingFormField,
  ClosingFormSection,
  closingFormSectionLabels,
  installmentLimitModeLabels,
  parseFieldConfig,
  useTenantAcceptanceTerms,
  useTenantAdditionals,
  useTenantClosingForm,
  useTenantFinancialSettings,
  useTenantPackages,
  useTenantPaymentMethods,
} from "@/features/configuracoes";
import {
  Evento,
  useEventoAcceptanceResponses,
  useEventoClosingResponses,
  useSubmitClosingForm,
} from "@/features/eventos";
import {
  applyPackageToFieldValues,
  buildAdicionaisSnapshot,
  buildFieldIdByKey,
  CLOSING_FORM_SECTIONS,
  getAdditionalsTotal,
  getEventoFieldValueAsString,
  getPackageFromPrice,
  parseAdicionaisSnapshot,
  recalculateFinancialTotals,
  resolveGuestCount,
} from "@/features/eventos/closing-form-runtime";
import { cn } from "@/lib/utils";

interface ClosingFormDialogProps {
  evento: Evento;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const buildInitialValues = (
  fields: ClosingFormField[],
  evento: Evento,
  savedResponses: Record<string, string>,
): Record<string, string> => {
  const values: Record<string, string> = {};

  fields.forEach((field) => {
    if (field.fieldKey && field.fieldKey in evento) {
      values[field.id] = getEventoFieldValueAsString(evento, field.fieldKey);
      return;
    }

    values[field.id] = savedResponses[field.id] ?? "";
  });

  return values;
};

export const ClosingFormDialog = ({
  evento,
  onOpenChange,
  onSuccess,
  open,
}: ClosingFormDialogProps) => {
  const { data: fields = [], isLoading: isFieldsLoading } = useTenantClosingForm();
  const { data: savedResponses = {}, isLoading: isResponsesLoading } = useEventoClosingResponses(
    open ? evento.id : null,
  );
  const { data: savedAcceptances = {}, isLoading: isAcceptancesLoading } =
    useEventoAcceptanceResponses(open ? evento.id : null);
  const { data: packages = [], isLoading: isPackagesLoading } = useTenantPackages();
  const { data: additionals = [], isLoading: isAdditionalsLoading } = useTenantAdditionals();
  const { data: paymentMethods = [], isLoading: isPaymentMethodsLoading } = useTenantPaymentMethods({
    includeInactive: false,
  });
  const { data: acceptanceTerms = [], isLoading: isTermsLoading } = useTenantAcceptanceTerms();
  const { data: financialSettings, isLoading: isFinancialLoading } = useTenantFinancialSettings();
  const submitClosingForm = useSubmitClosingForm();

  const activeFields = useMemo(
    () => fields.filter((field) => field.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [fields],
  );

  const activeTerms = useMemo(
    () => acceptanceTerms.filter((term) => term.active),
    [acceptanceTerms],
  );

  const fieldIdByKey = useMemo(() => buildFieldIdByKey(activeFields), [activeFields]);

  const fieldsBySection = useMemo(() => {
    const grouped = new Map<ClosingFormSection, ClosingFormField[]>();
    CLOSING_FORM_SECTIONS.forEach((section) => grouped.set(section, []));

    activeFields.forEach((field) => {
      const sectionFields = grouped.get(field.section) ?? [];
      sectionFields.push(field);
      grouped.set(field.section, sectionFields);
    });

    return grouped;
  }, [activeFields]);

  const depositMethods = useMemo(
    () => paymentMethods.filter((method) => method.allowedForDeposit),
    [paymentMethods],
  );

  const balanceMethods = useMemo(
    () => paymentMethods.filter((method) => method.allowedForRemainingBalance),
    [paymentMethods],
  );

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [additionalSelections, setAdditionalSelections] = useState<Map<string, number>>(new Map());
  const [acceptedTermIds, setAcceptedTermIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading =
    isFieldsLoading ||
    isResponsesLoading ||
    isAcceptancesLoading ||
    isPackagesLoading ||
    isAdditionalsLoading ||
    isPaymentMethodsLoading ||
    isTermsLoading ||
    isFinancialLoading;

  useEffect(() => {
    if (!open || isLoading) return;

    let values = buildInitialValues(activeFields, evento, savedResponses);
    values = recalculateFinancialTotals(values, fieldIdByKey);

    setFieldValues(values);
    setSelectedPackageId(evento.pacote_id ? String(evento.pacote_id) : null);

    const snapshot = parseAdicionaisSnapshot(evento.adicionais_snapshot);
    setAdditionalSelections(new Map(snapshot.map((item) => [String(item.id), item.quantity])));

    const accepted = new Set<string>();
    activeTerms.forEach((term) => {
      if (savedAcceptances[term.id]) accepted.add(term.id);
    });
    setAcceptedTermIds(accepted);
    setErrors({});
  }, [
    activeFields,
    activeTerms,
    evento,
    fieldIdByKey,
    isLoading,
    open,
    savedAcceptances,
    savedResponses,
  ]);

  const syncFinancialFields = (nextValues: Record<string, string>) =>
    recalculateFinancialTotals(nextValues, fieldIdByKey);

  const updateFieldValue = (fieldId: string, value: string) => {
    setFieldValues((previous) => syncFinancialFields({ ...previous, [fieldId]: value }));

    setErrors((previous) => {
      if (!previous[fieldId]) return previous;
      const next = { ...previous };
      delete next[fieldId];
      return next;
    });
  };

  const handleSelectPackage = (pkg: PackageData) => {
    setSelectedPackageId(pkg.id);
    const guestCount = resolveGuestCount(evento, fieldValues, fieldIdByKey);

    setFieldValues((previous) => {
      const withPackage = applyPackageToFieldValues(pkg, guestCount, previous, fieldIdByKey);
      return syncFinancialFields(withPackage);
    });
  };

  const toggleAdditional = (additionalId: string) => {
    setAdditionalSelections((previous) => {
      const next = new Map(previous);
      if (next.has(additionalId)) next.delete(additionalId);
      else next.set(additionalId, 1);

      const guestCount = resolveGuestCount(evento, fieldValues, fieldIdByKey);
      const snapshot = buildAdicionaisSnapshot(additionals, next, guestCount);
      const total = getAdditionalsTotal(snapshot);

      setFieldValues((fieldPrevious) => {
        const fieldNext = { ...fieldPrevious };
        const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
        const adicionaisSelecionadosId = fieldIdByKey.get("adicionais_selecionados");

        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(total);
        if (adicionaisSelecionadosId) {
          fieldNext[adicionaisSelecionadosId] = snapshot.map((item) => item.name).join(", ");
        }

        return syncFinancialFields(fieldNext);
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

      const guestCount = resolveGuestCount(evento, fieldValues, fieldIdByKey);
      const snapshot = buildAdicionaisSnapshot(additionals, next, guestCount);
      const total = getAdditionalsTotal(snapshot);

      setFieldValues((fieldPrevious) => {
        const fieldNext = { ...fieldPrevious };
        const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(total);
        return syncFinancialFields(fieldNext);
      });

      return next;
    });
  };

  const toggleTerm = (termId: string) => {
    setAcceptedTermIds((previous) => {
      const next = new Set(previous);
      if (next.has(termId)) next.delete(termId);
      else next.add(termId);
      return next;
    });

    setErrors((previous) => {
      if (!previous[`term-${termId}`]) return previous;
      const next = { ...previous };
      delete next[`term-${termId}`];
      return next;
    });
  };

  const shouldShowSection = (section: ClosingFormSection) => {
    const sectionFields = fieldsBySection.get(section) ?? [];
    if (sectionFields.length > 0) return true;

    switch (section) {
      case "pacote":
        return packages.length > 0;
      case "adicionais":
        return additionals.length > 0;
      case "pagamento":
        return paymentMethods.length > 0 || Boolean(financialSettings);
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

    const pacoteNomeField = activeFields.find((field) => field.fieldKey === "pacote_nome");
    if (
      pacoteNomeField?.required &&
      packages.length > 0 &&
      !selectedPackageId &&
      !(fieldValues[pacoteNomeField.id]?.trim())
    ) {
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

    const guestCount = resolveGuestCount(evento, fieldValues, fieldIdByKey);
    const adicionaisSnapshot = buildAdicionaisSnapshot(
      additionals,
      additionalSelections,
      guestCount,
    );

    try {
      await submitClosingForm.mutateAsync({
        acceptanceResponses: activeTerms.map((term) => ({
          accepted: acceptedTermIds.has(term.id),
          termId: Number(term.id),
        })),
        adicionaisSnapshot,
        eventoId: evento.id,
        fieldValues,
        fields: activeFields.map((field) => ({
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          id: field.id,
          required: field.required,
        })),
        pacoteId: selectedPackageId ? Number(selectedPackageId) : evento.pacote_id,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch {
      setErrors({ form: "Nao foi possivel confirmar o fechamento. Tente novamente." });
    }
  };

  const renderFieldInput = (field: ClosingFormField) => {
    const value = fieldValues[field.id] ?? "";
    const isReadOnlyTotal =
      field.fieldKey === "valor_total" || field.fieldKey === "valor_saldo";
    const config = parseFieldConfig(field.config);

    if (field.fieldKey === "forma_pagamento_entrada") {
      return (
        <Select value={value || undefined} onValueChange={(next) => updateFieldValue(field.id, next)}>
          <SelectTrigger id={`closing-field-${field.id}`} className="text-sm">
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
          <SelectTrigger id={`closing-field-${field.id}`} className="text-sm">
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
          id={`closing-field-${field.id}`}
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
            onCheckedChange={(checked) =>
              updateFieldValue(field.id, checked === true ? "true" : "")
            }
            className="mt-0.5"
          />
          <span>{field.description ?? field.label}</span>
        </label>
      );
    }

    if (field.fieldType === "select") {
      const options = config.options ?? [];
      return (
        <Select value={value || undefined} onValueChange={(next) => updateFieldValue(field.id, next)}>
          <SelectTrigger id={`closing-field-${field.id}`} className="text-sm">
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
      const options = config.options ?? [];
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
              {option}
            </label>
          ))}
        </div>
      );
    }

    return (
      <Input
        id={`closing-field-${field.id}`}
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
        max={
          field.fieldKey === "parcelas" && financialSettings?.max_installments
            ? financialSettings.max_installments
            : undefined
        }
        step={field.fieldType === "currency" ? "0.01" : undefined}
        onChange={(event) => updateFieldValue(field.id, event.target.value)}
        className="text-sm"
      />
    );
  };

  const renderPackageSection = () => {
    const sectionFields = (fieldsBySection.get("pacote") ?? []).filter(
      (field) => field.fieldKey !== "pacote_nome" || packages.length === 0,
    );

    return (
      <div className="space-y-4">
        {packages.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {packages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              const fromPrice = getPackageFromPrice(pkg);

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectPackage(pkg)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 bg-background/50 hover:border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                    {fromPrice > 0 && (
                      <span className="text-sm font-bold text-primary shrink-0">
                        a partir de {formatCurrency(fromPrice)}
                      </span>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pkg.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {sectionFields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={`closing-field-${field.id}`} className="text-xs">
              {field.label}
              {field.required ? " *" : ""}
            </Label>
            {renderFieldInput(field)}
            {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
          </div>
        ))}

        {errors.pacote && <p className="text-xs text-destructive">{errors.pacote}</p>}
      </div>
    );
  };

  const renderAdditionalsSection = () => {
    const sectionFields = (fieldsBySection.get("adicionais") ?? []).filter(
      (field) => field.fieldKey !== "adicionais_selecionados" || additionals.length === 0,
    );

    return (
      <div className="space-y-4">
        {additionals.length > 0 && (
          <div className="space-y-2">
            {additionals.map((item) => {
              const isSelected = additionalSelections.has(item.id);
              const quantity = additionalSelections.get(item.id) ?? 1;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-3 space-y-2",
                    isSelected ? "border-primary bg-primary/5" : "border-border/60 bg-background/50",
                  )}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleAdditional(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {additionalCategoryLabels[item.category]} ·{" "}
                        {additionalBillingTypeLabels[item.type]} · {formatCurrency(item.price)}
                      </p>
                    </div>
                  </label>
                  {isSelected && item.type !== "fixo" && (
                    <div className="pl-7">
                      <Label className="text-xs text-muted-foreground">
                        Quantidade{item.type === "por_hora" ? " (horas)" : ""}
                      </Label>
                      <Input
                        min="1"
                        type="number"
                        value={quantity}
                        onChange={(event) =>
                          updateAdditionalQuantity(item.id, Number(event.target.value))
                        }
                        className="mt-1 max-w-[120px] text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {sectionFields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={`closing-field-${field.id}`} className="text-xs">
              {field.label}
              {field.required ? " *" : ""}
            </Label>
            {renderFieldInput(field)}
            {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
          </div>
        ))}
      </div>
    );
  };

  const renderPaymentSection = () => {
    const sectionFields = fieldsBySection.get("pagamento") ?? [];

    return (
      <div className="space-y-4">
        {sectionFields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={`closing-field-${field.id}`} className="text-xs">
              {field.label}
              {field.required ? " *" : ""}
            </Label>
            {renderFieldInput(field)}
            {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
          </div>
        ))}

        {financialSettings && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm">Regras financeiras do espaço</p>
            {financialSettings.min_deposit_percentage != null && (
              <p>Entrada mínima: {financialSettings.min_deposit_percentage}%</p>
            )}
            {financialSettings.max_deposit_due_days != null && (
              <p>Prazo máximo para entrada: {financialSettings.max_deposit_due_days} dias</p>
            )}
            {financialSettings.max_balance_due_days != null && (
              <p>Prazo máximo para saldo: {financialSettings.max_balance_due_days} dias</p>
            )}
            <p>Parcelas máximas: {financialSettings.max_installments}</p>
            <p>{installmentLimitModeLabels[financialSettings.installment_limit_mode]}</p>
            {financialSettings.cancellation_policy && (
              <p className="whitespace-pre-wrap">
                Cancelamento: {financialSettings.cancellation_policy}
              </p>
            )}
            {financialSettings.rescheduling_policy && (
              <p className="whitespace-pre-wrap">
                Remarcação: {financialSettings.rescheduling_policy}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAcceptanceSection = () => {
    const sectionFields = fieldsBySection.get("aceites") ?? [];

    return (
      <div className="space-y-4">
        {sectionFields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            {field.fieldType !== "checkbox" && field.fieldType !== "acceptance" && (
              <Label htmlFor={`closing-field-${field.id}`} className="text-xs">
                {field.label}
                {field.required ? " *" : ""}
              </Label>
            )}
            {renderFieldInput(field)}
            {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
          </div>
        ))}

        {activeTerms.map((term) => (
          <label
            key={term.id}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3 cursor-pointer"
          >
            <Checkbox
              checked={acceptedTermIds.has(term.id)}
              onCheckedChange={() => toggleTerm(term.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">
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
      </div>
    );
  };

  const renderSectionContent = (section: ClosingFormSection) => {
    switch (section) {
      case "pacote":
        return renderPackageSection();
      case "adicionais":
        return renderAdditionalsSection();
      case "pagamento":
        return renderPaymentSection();
      case "aceites":
        return renderAcceptanceSection();
      default:
        return (fieldsBySection.get(section) ?? []).map((field) => (
          <div key={field.id} className="space-y-1.5">
            {field.fieldType !== "checkbox" && field.fieldType !== "acceptance" && (
              <Label htmlFor={`closing-field-${field.id}`} className="text-xs">
                {field.label}
                {field.required ? " *" : ""}
              </Label>
            )}
            {renderFieldInput(field)}
            {errors[field.id] && <p className="text-xs text-destructive">{errors[field.id]}</p>}
          </div>
        ));
    }
  };

  const visibleSections = CLOSING_FORM_SECTIONS.filter(shouldShowSection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Confirmar fechamento da festa
          </DialogTitle>
          <DialogDescription>
            Revise e confirme os dados com o cliente. Ao salvar, a festa avança para o funil Festa
            e os dados do contrato são atualizados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Carregando formulário...</p>
          )}

          {!isLoading && visibleSections.length === 0 && (
            <p className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Nenhum campo ativo. Configure o formulário em Configurações → Formulário de
              Contratação.
            </p>
          )}

          {!isLoading &&
            visibleSections.map((section) => (
              <div key={section} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {closingFormSectionLabels[section]}
                </h3>
                <div className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-4">
                  {renderSectionContent(section)}
                </div>
              </div>
            ))}

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitClosingForm.isPending || isLoading || visibleSections.length === 0}
            >
              {submitClosingForm.isPending ? "Confirmando..." : "Confirmar fechamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
