import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultFinancialSettings,
  downPaymentModeLabels,
  downPaymentMethodLabels,
  installmentLimitModeLabels,
  type DownPaymentMethod,
  type DownPaymentMode,
  type FinancialSettings,
  type InstallmentLimitMode,
  useSaveTenantFinancialSettings,
  useTenantFinancialSettings,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const inputClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
    <div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {children}
  </div>
);

interface FinancialSettingsConfigProps {
  guidedMode?: boolean;
  onRegisterActions?: (actions: {
    save: () => Promise<boolean>;
    isPending: boolean;
  }) => void;
  showSettingsHeader?: boolean;
}

export const FinancialSettingsConfig = ({
  guidedMode = false,
  onRegisterActions,
  showSettingsHeader = false,
}: FinancialSettingsConfigProps) => {
  const { data: settings, isLoading } = useTenantFinancialSettings();
  const saveSettings = useSaveTenantFinancialSettings();
  const [form, setForm] = useState<FinancialSettings>(defaultFinancialSettings);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const updateForm = (patch: Partial<FinancialSettings>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (form.down_payment_mode === "fixed" && !form.default_down_payment_fixed_value) {
      toast({
        title: "Informe o valor fixo de entrada",
        variant: "destructive",
      });
      return false;
    }

    if (
      !form.remaining_pix_installments &&
      !form.remaining_card_installments &&
      !form.remaining_due_before_event_enabled
    ) {
      toast({
        title: "Selecione ao menos uma forma para o restante do valor",
        variant: "destructive",
      });
      return false;
    }

    try {
      await saveSettings.mutateAsync({
        ...form,
        default_down_payment_fixed_value:
          form.down_payment_mode === "fixed" ? form.default_down_payment_fixed_value : null,
      });
      if (!guidedMode) {
        toast({ title: "Regras financeiras salvas" });
      }
      return true;
    } catch {
      toast({
        title: "Nao foi possivel salvar as regras financeiras",
        variant: "destructive",
      });
      return false;
    }
  }, [form, guidedMode, saveSettings]);

  useEffect(() => {
    if (!onRegisterActions) return;
    onRegisterActions({
      save: handleSave,
      isPending: saveSettings.isPending,
    });
  }, [handleSave, onRegisterActions, saveSettings.isPending]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando regras financeiras...</p>;
  }

  const remainingMethodCount = [
    form.remaining_pix_installments,
    form.remaining_card_installments,
    form.remaining_due_before_event_enabled,
  ].filter(Boolean).length;

  const downPaymentLabel =
    form.down_payment_mode === "percentage"
      ? `entrada de ${form.default_down_payment_percentage}%`
      : "entrada com valor fixo";

  const saveButton = (className?: string) => (
    <Button
      onClick={() => void handleSave()}
      disabled={saveSettings.isPending}
      className={cn("shrink-0", className)}
    >
      Salvar regras financeiras
    </Button>
  );

  return (
    <div className={showSettingsHeader ? "space-y-4" : "space-y-5"}>
      {showSettingsHeader && (
        <SettingsPageHeader
          title={SETTINGS_PAGE_META.financeiro.title}
          description={SETTINGS_PAGE_META.financeiro.description}
          renderAction={(className) => saveButton(className)}
          stats={
            <>
              <SettingsStatChip>{downPaymentLabel}</SettingsStatChip>
              <SettingsStatChip>
                até {form.max_installments} {form.max_installments === 1 ? "parcela" : "parcelas"}
              </SettingsStatChip>
              <SettingsStatChip>
                {remainingMethodCount}{" "}
                {remainingMethodCount === 1 ? "forma para o restante" : "formas para o restante"}
              </SettingsStatChip>
            </>
          }
        />
      )}
      <SectionCard
        title="Entrada"
        description="Defina como a entrada padrao sera calculada e qual metodo de pagamento aceitar."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Tipo de entrada</Label>
              <Select
                value={form.down_payment_mode}
                onValueChange={(value) =>
                  updateForm({ down_payment_mode: value as DownPaymentMode })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de entrada" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(downPaymentModeLabels) as DownPaymentMode[]).map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {downPaymentModeLabels[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.down_payment_mode === "percentage" ? (
              <div>
                <Label htmlFor="down-payment-percentage" className="mb-2 block">
                  Percentual de entrada (%)
                </Label>
                <Input
                  id="down-payment-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={form.default_down_payment_percentage}
                  onChange={(event) =>
                    updateForm({ default_down_payment_percentage: Number(event.target.value) })
                  }
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="down-payment-fixed" className="mb-2 block">
                  Valor fixo de entrada (R$)
                </Label>
                <CurrencyInput
                  id="down-payment-fixed"
                  value={form.default_down_payment_fixed_value ?? 0}
                  onChange={(value) => updateForm({ default_down_payment_fixed_value: value })}
                  className={inputClassName}
                />
              </div>
            )}

            <div>
              <Label className="mb-2 block">Metodo de pagamento</Label>
              <Select
                value={form.down_payment_method}
                onValueChange={(value) =>
                  updateForm({ down_payment_method: value as DownPaymentMethod })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o metodo" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(downPaymentMethodLabels) as DownPaymentMethod[]).map((method) => (
                    <SelectItem key={method} value={method}>
                      {downPaymentMethodLabels[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Restante do valor"
        description="Escolha as formas de pagamento aceitas para quitar o saldo apos a entrada."
      >
        <div className="space-y-4">
          <label className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-4 cursor-pointer">
            <Checkbox
              checked={form.remaining_pix_installments}
              onCheckedChange={(checked) =>
                updateForm({ remaining_pix_installments: checked === true })
              }
            />
            <div>
              <p className="text-sm font-medium text-foreground">Parcelado via Pix</p>
              <p className="text-sm text-muted-foreground">
                Permite dividir o restante em parcelas pagas por Pix.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-4 cursor-pointer">
            <Checkbox
              checked={form.remaining_card_installments}
              onCheckedChange={(checked) =>
                updateForm({ remaining_card_installments: checked === true })
              }
            />
            <div>
              <p className="text-sm font-medium text-foreground">Parcelado via cartao de credito</p>
              <p className="text-sm text-muted-foreground">
                Permite dividir o restante em parcelas no cartao de credito.
              </p>
            </div>
          </label>

          <div className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={form.remaining_due_before_event_enabled}
                onCheckedChange={(checked) =>
                  updateForm({ remaining_due_before_event_enabled: checked === true })
                }
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Pagamento integral antes da festa
                </p>
                <p className="text-sm text-muted-foreground">
                  Exige o pagamento total do restante em uma data fixa antes do evento.
                </p>
              </div>
            </label>

            {form.remaining_due_before_event_enabled && (
              <div className="pl-7">
                <Label htmlFor="remaining-due-days" className="mb-2 block">
                  Dias antes da festa
                </Label>
                <Input
                  id="remaining-due-days"
                  type="number"
                  min="0"
                  value={form.remaining_due_days_before_event}
                  onChange={(event) =>
                    updateForm({ remaining_due_days_before_event: Number(event.target.value) })
                  }
                  className="max-w-[160px]"
                />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Regras de parcelamento"
        description="Configure o limite maximo de parcelas e se elas podem ultrapassar a data da festa."
      >
        <div className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="max-installments" className="mb-2 block">
              Parcelas maximas
            </Label>
            <Input
              id="max-installments"
              type="number"
              min="1"
              value={form.max_installments}
              onChange={(event) => updateForm({ max_installments: Number(event.target.value) })}
            />
          </div>

          <div>
            <Label className="mb-3 block">Limite das parcelas</Label>
            <RadioGroup
              value={form.installment_limit_mode}
              onValueChange={(value) =>
                updateForm({ installment_limit_mode: value as InstallmentLimitMode })
              }
              className="space-y-3"
            >
              {(Object.keys(installmentLimitModeLabels) as InstallmentLimitMode[]).map((mode) => (
                <label
                  key={mode}
                  htmlFor={`installment-limit-${mode}`}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-4 cursor-pointer"
                >
                  <RadioGroupItem
                    value={mode}
                    id={`installment-limit-${mode}`}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {installmentLimitModeLabels[mode]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mode === "until_event_date"
                        ? "O numero de parcelas nao pode ultrapassar o periodo ate a data do evento."
                        : "Permite parcelas com vencimento apos a data da festa."}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </SectionCard>

      {!guidedMode && !showSettingsHeader ? (
        <div className="flex justify-end">
          {saveButton()}
        </div>
      ) : null}
    </div>
  );
};
