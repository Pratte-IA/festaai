import { useMemo, useState, type ReactNode } from "react";
import { Eye, FileCheck2, Info, Upload } from "lucide-react";

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
} from "@/data/packagesData";
import type { PackageData } from "@/data/packagesData";
import {
  ClosingFormField,
  ClosingFormSection,
  closingFormSectionLabels,
  downPaymentMethodLabels,
  installmentLimitModeLabels,
  parseFieldConfig,
  paymentMethodTypeLabels,
  useTenantAcceptanceTerms,
  useTenantAdditionals,
  useTenantClosingForm,
  useTenantFinancialSettings,
  useTenantPackages,
  useTenantPaymentMethods,
  type PaymentMethodType,
  type TenantAcceptanceTerm,
} from "@/features/configuracoes";
import type { Evento } from "@/features/eventos/types";
import { cn } from "@/lib/utils";
import {
  applyPackageToFieldValues,
  buildFieldIdByKey,
  getPackageFromPrice,
  getPackagePriceForGuests,
  isHiddenPackageFieldKey,
  PACKAGE_SELECTOR_FIELD_KEY,
  recalculateFinancialTotals,
  resolveGuestCount,
} from "@/features/eventos/closing-form-runtime";

const PREVIEW_SECTIONS: ClosingFormSection[] = [
  "cliente",
  "aniversariante",
  "festa",
  "pacote",
  "adicionais",
  "pagamento",
  "contrato",
  "aceites",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const PREVIEW_EVENTO = {
  quantidade_convidados: 0,
} as Evento;

const PreviewBadge = ({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "muted" | "outline";
}) => {
  const classes = {
    default: "bg-muted text-muted-foreground",
    muted: "bg-muted/60 text-muted-foreground",
    outline: "border border-border/60 text-muted-foreground",
    primary: "bg-primary/10 text-primary",
  };

  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
        classes[variant],
      )}
    >
      {children}
    </span>
  );
};

interface PreviewFieldInputProps {
  field: ClosingFormField;
  onChange: (value: string) => void;
  value: string;
}

const PreviewFieldInput = ({ field, onChange, value }: PreviewFieldInputProps) => {
  const config = parseFieldConfig(field.config);
  const isReadOnlyTotal = field.fieldKey === "valor_total";

  if (field.fieldType === "textarea") {
    return (
      <Textarea
        id={`preview-field-${field.id}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Preencha para simular..."
        className="text-sm bg-background"
      />
    );
  }

  if (field.fieldType === "checkbox" || field.fieldType === "acceptance") {
    return (
      <label className="flex items-start gap-2 text-sm text-foreground">
        <Checkbox
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked === true ? "true" : "")}
          className="mt-0.5"
        />
        <span>{field.description ?? field.label}</span>
      </label>
    );
  }

  if (field.fieldType === "select") {
    const options = config.options ?? [];
    return (
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={`preview-field-${field.id}`} className="text-sm bg-background">
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
    const selected = value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

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
                onChange(next.join(", "));
              }}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (field.fieldType === "file") {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-center">
        <Upload className="mx-auto h-5 w-5 text-muted-foreground mb-2" aria-hidden />
        <p className="text-xs text-muted-foreground">
          Simulação — upload desabilitado no preview
        </p>
        <Input type="file" disabled className="mt-2 text-sm opacity-50" />
      </div>
    );
  }

  return (
    <Input
      id={`preview-field-${field.id}`}
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
      placeholder="Preencha para simular..."
      onChange={(event) => onChange(event.target.value)}
      className="text-sm bg-background"
    />
  );
};

export const FormPreviewPanel = () => {
  const { data: fields = [], isLoading: isFieldsLoading } = useTenantClosingForm();
  const { data: packages = [], isLoading: isPackagesLoading } = useTenantPackages();
  const { data: additionals = [], isLoading: isAdditionalsLoading } = useTenantAdditionals();
  const { data: paymentMethods = [], isLoading: isPaymentMethodsLoading } = useTenantPaymentMethods({
    includeInactive: false,
  });
  const { data: acceptanceTerms = [], isLoading: isTermsLoading } = useTenantAcceptanceTerms();
  const { data: financialSettings, isLoading: isFinancialLoading } = useTenantFinancialSettings();

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedAdditionalIds, setSelectedAdditionalIds] = useState<Set<string>>(new Set());
  const [acceptedTermIds, setAcceptedTermIds] = useState<Set<string>>(new Set());

  const isLoading =
    isFieldsLoading ||
    isPackagesLoading ||
    isAdditionalsLoading ||
    isPaymentMethodsLoading ||
    isTermsLoading ||
    isFinancialLoading;

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
    PREVIEW_SECTIONS.forEach((section) => grouped.set(section, []));

    activeFields.forEach((field) => {
      const sectionFields = grouped.get(field.section) ?? [];
      sectionFields.push(field);
      grouped.set(field.section, sectionFields);
    });

    return grouped;
  }, [activeFields]);

  const resolveSelectedPackage = () =>
    packages.find((pkg) => pkg.id === selectedPackageId) ?? null;

  const resolvePacoteValue = (
    values: Record<string, string>,
    pkg: PackageData | null = resolveSelectedPackage(),
  ) => {
    if (!pkg) return undefined;
    const guestCount = resolveGuestCount(PREVIEW_EVENTO, values, fieldIdByKey);
    return guestCount > 0 ? getPackagePriceForGuests(pkg, guestCount) : getPackageFromPrice(pkg);
  };

  const syncFinancialFields = (
    nextValues: Record<string, string>,
    pacoteValue?: number,
  ) => recalculateFinancialTotals(nextValues, fieldIdByKey, { pacoteValue });

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
  };

  const handleSelectPackage = (pkg: PackageData) => {
    setSelectedPackageId(pkg.id);
    const guestCount = resolveGuestCount(PREVIEW_EVENTO, fieldValues, fieldIdByKey);

    setFieldValues((previous) => {
      const withPackage = applyPackageToFieldValues(pkg, guestCount, previous, fieldIdByKey);
      const pacoteValue =
        guestCount > 0 ? getPackagePriceForGuests(pkg, guestCount) : getPackageFromPrice(pkg);
      return syncFinancialFields(withPackage, pacoteValue);
    });
  };

  const toggleAdditional = (additionalId: string) => {
    setSelectedAdditionalIds((previous) => {
      const next = new Set(previous);
      if (next.has(additionalId)) next.delete(additionalId);
      else next.add(additionalId);

      const selectedTotal = additionals
        .filter((item) => next.has(item.id))
        .reduce((sum, item) => sum + item.price, 0);

      setFieldValues((fieldPrevious) => {
        const fieldNext = { ...fieldPrevious };
        const adicionaisFieldId = fieldIdByKey.get("valor_adicionais");
        if (adicionaisFieldId) fieldNext[adicionaisFieldId] = String(selectedTotal);
        return syncFinancialFields(fieldNext, resolvePacoteValue(fieldNext));
      });

      return next;
    });
  };

  const toggleTerm = (term: TenantAcceptanceTerm) => {
    setAcceptedTermIds((previous) => {
      const next = new Set(previous);
      if (next.has(term.id)) next.delete(term.id);
      else next.add(term.id);
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

  const visibleSections = PREVIEW_SECTIONS.filter(shouldShowSection);

  const renderFormFields = (sectionFields: ClosingFormField[]) => (
    <div className="space-y-3">
      {sectionFields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          {field.fieldType !== "checkbox" && field.fieldType !== "acceptance" && (
            <Label htmlFor={`preview-field-${field.id}`} className="text-xs font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          )}
          {field.description &&
            field.fieldType !== "checkbox" &&
            field.fieldType !== "acceptance" && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          <PreviewFieldInput
            field={field}
            value={fieldValues[field.id] ?? ""}
            onChange={(value) => updateFieldValue(field.id, value)}
          />
        </div>
      ))}
    </div>
  );

  const renderPackageSection = () => {
    const sectionFields = (fieldsBySection.get("pacote") ?? []).filter(
      (field) => !isHiddenPackageFieldKey(field.fieldKey) && field.fieldKey !== PACKAGE_SELECTOR_FIELD_KEY,
    );
    const selectedPackage = resolveSelectedPackage();
    const guestCount = resolveGuestCount(PREVIEW_EVENTO, fieldValues, fieldIdByKey);
    const selectedPrice = selectedPackage ? resolvePacoteValue(fieldValues, selectedPackage) : undefined;

    return (
      <div className="space-y-4">
        {packages.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="preview-package-select" className="text-xs font-medium">
              Pacote contratado<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Select
              value={selectedPackageId ?? undefined}
              onValueChange={(packageId) => {
                const pkg = packages.find((item) => item.id === packageId);
                if (pkg) handleSelectPackage(pkg);
              }}
            >
              <SelectTrigger id="preview-package-select" className="text-sm bg-background">
                <SelectValue placeholder="Selecione um pacote" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPackage && selectedPrice != null && selectedPrice > 0 && (
              <p className="text-xs text-muted-foreground">
                Valor do pacote
                {guestCount > 0 ? ` para ${guestCount} convidado${guestCount === 1 ? "" : "s"}` : ""}:{" "}
                <span className="font-medium text-foreground">{formatCurrency(selectedPrice)}</span>
              </p>
            )}
          </div>
        )}

        {packages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum pacote ativo cadastrado na central de controle.
          </p>
        )}

        {sectionFields.length > 0 && renderFormFields(sectionFields)}
      </div>
    );
  };

  const renderAdditionalsSection = () => {
    const sectionFields = fieldsBySection.get("adicionais") ?? [];

    return (
      <div className="space-y-4">
        {sectionFields.length > 0 && renderFormFields(sectionFields)}

        {additionals.length > 0 && (
          <div className="space-y-2">
            {additionals.map((item) => {
              const isSelected = selectedAdditionalIds.has(item.id);

              return (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-background/50 hover:border-border",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleAdditional(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      {item.isRequired && <PreviewBadge variant="primary">Obrigatório</PreviewBadge>}
                      <PreviewBadge variant="outline">
                        {additionalBillingTypeLabels[item.type]}
                      </PreviewBadge>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mb-1">{item.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {additionalCategoryLabels[item.category]} · {formatCurrency(item.price)}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPaymentSection = () => {
    const sectionFields = fieldsBySection.get("pagamento") ?? [];
    const settings = financialSettings;

    return (
      <div className="space-y-4">
        {sectionFields.length > 0 && renderFormFields(sectionFields)}

        {paymentMethods.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Métodos disponíveis
            </p>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-xl border border-border/60 bg-background/50 p-3 space-y-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{method.name}</span>
                  <PreviewBadge>
                    {paymentMethodTypeLabels[method.paymentType as PaymentMethodType]}
                  </PreviewBadge>
                  {method.allowsInstallments && method.maxInstallments && (
                    <PreviewBadge variant="outline">Até {method.maxInstallments}x</PreviewBadge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrada: {method.allowedForDeposit ? "Sim" : "Não"} · Saldo:{" "}
                  {method.allowedForRemainingBalance ? "Sim" : "Não"}
                  {(method.feePercentage != null || method.feeFixed != null) && (
                    <>
                      {" "}
                      · Taxas:{" "}
                      {method.feePercentage != null ? `${method.feePercentage}%` : "—"}
                      {method.feeFixed != null ? ` + ${formatCurrency(method.feeFixed)}` : ""}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {settings && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Regras financeiras globais
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              {settings.min_deposit_percentage != null && (
                <li>Entrada mínima: {settings.min_deposit_percentage}%</li>
              )}
              <li>
                Entrada padrão:{" "}
                {settings.down_payment_mode === "percentage"
                  ? `${settings.default_down_payment_percentage}%`
                  : formatCurrency(settings.default_down_payment_fixed_value ?? 0)}{" "}
                via {downPaymentMethodLabels[settings.down_payment_method]}
              </li>
              {settings.max_deposit_due_days != null && (
                <li>Prazo máximo para entrada: {settings.max_deposit_due_days} dias</li>
              )}
              {settings.max_balance_due_days != null && (
                <li>Prazo máximo para saldo: {settings.max_balance_due_days} dias</li>
              )}
              <li>Parcelas máximas: {settings.max_installments}</li>
              <li>{installmentLimitModeLabels[settings.installment_limit_mode]}</li>
            </ul>
            {settings.cancellation_policy && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Política de cancelamento</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {settings.cancellation_policy}
                </p>
              </div>
            )}
            {settings.rescheduling_policy && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Política de remarcação</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {settings.rescheduling_policy}
                </p>
              </div>
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
        {sectionFields.length > 0 && renderFormFields(sectionFields)}

        {activeTerms.length > 0 && (
          <div className="space-y-2">
            {activeTerms.map((term) => (
              <label
                key={term.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3 cursor-pointer"
              >
                <Checkbox
                  checked={acceptedTermIds.has(term.id)}
                  onCheckedChange={() => toggleTerm(term)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{term.title}</span>
                    {term.isRequired ? (
                      <PreviewBadge variant="primary">Obrigatório</PreviewBadge>
                    ) : (
                      <PreviewBadge variant="outline">Opcional</PreviewBadge>
                    )}
                    {term.appearsInContract ? (
                      <PreviewBadge>Aparece no contrato</PreviewBadge>
                    ) : (
                      <PreviewBadge variant="muted">Só no formulário</PreviewBadge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{term.content}</p>
                </div>
              </label>
            ))}
          </div>
        )}
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
        return renderFormFields(fieldsBySection.get(section) ?? []);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground flex items-center gap-2">
            <Eye className="h-4 w-4" aria-hidden />
            Preview — apenas simulação
          </p>
          <p className="text-muted-foreground">
            Esta visualização usa os dados reais do seu espaço, mas nada é salvo no banco. Use para
            revisar como o cliente verá o formulário de contratação.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/30 shadow-sm overflow-hidden">
        <div className="border-b border-border/40 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground">Formulário de Contratação da Festa</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            O cliente revisará os dados da festa, escolherá pacote e adicionais, confirmará
            pagamento e aceitará os termos antes de concluir a contratação.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Montando preview do formulário...</p>
          )}

          {!isLoading && visibleSections.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum conteúdo ativo para exibir. Configure campos, pacotes ou aceites nas outras
                abas.
              </p>
            </div>
          )}

          {!isLoading &&
            visibleSections.map((section) => (
              <section key={section} className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/30 pb-2">
                  {closingFormSectionLabels[section]}
                </h3>
                <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                  {renderSectionContent(section)}
                </div>
              </section>
            ))}

          {!isLoading && visibleSections.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                Simulação local — nenhum dado será enviado ou persistido.
              </p>
              <Button type="button" disabled className="sm:min-w-[200px]">
                Revisar contratação
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
