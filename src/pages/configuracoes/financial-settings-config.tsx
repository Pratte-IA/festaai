import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultFinancialSettings,
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

export const FinancialSettingsConfig = () => {
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

  const handleSave = async () => {
    if (form.down_payment_mode === "fixed" && !form.default_down_payment_fixed_value) {
      toast({
        title: "Informe o valor fixo de entrada",
        variant: "destructive",
      });
      return;
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
      return;
    }

    try {
      await saveSettings.mutateAsync({
        ...form,
        default_down_payment_fixed_value:
          form.down_payment_mode === "fixed" ? form.default_down_payment_fixed_value : null,
      });
      toast({ title: "Regras financeiras salvas" });
    } catch {
      toast({
        title: "Nao foi possivel salvar as regras financeiras",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando regras financeiras...</p>;
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Entrada"
        description="Defina como a entrada padrao sera calculada e qual metodo de pagamento aceitar."
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Tipo de entrada</Label>
            <div className="flex gap-2">
              {(["percentage", "fixed"] as DownPaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateForm({ down_payment_mode: mode })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    form.down_payment_mode === mode
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background/50 text-muted-foreground hover:border-border",
                  )}
                >
                  {mode === "percentage" ? "% de entrada" : "Valor fixo de entrada"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveSettings.isPending}>
          Salvar regras financeiras
        </Button>
      </div>
    </div>
  );
};
