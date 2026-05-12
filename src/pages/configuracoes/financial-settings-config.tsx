import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaveTenantFinancialSettings, useTenantFinancialSettings } from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

export const FinancialSettingsConfig = () => {
  const { data: settings, isLoading } = useTenantFinancialSettings();
  const saveSettings = useSaveTenantFinancialSettings();
  const [downPayment, setDownPayment] = useState("30");
  const [maxInstallments, setMaxInstallments] = useState("3");

  useEffect(() => {
    if (settings) {
      setDownPayment(String(settings.default_down_payment_percentage));
      setMaxInstallments(String(settings.max_installments));
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings.mutateAsync({
        default_down_payment_percentage: Number(downPayment),
        max_installments: Number(maxInstallments),
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/40 p-5">
          <label className="text-sm font-medium text-foreground block mb-2">
            Valor de entrada padrão (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={downPayment}
            onChange={(event) => setDownPayment(event.target.value)}
          />
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-5">
          <label className="text-sm font-medium text-foreground block mb-2">Parcelas máximas</label>
          <Input
            type="number"
            min="1"
            value={maxInstallments}
            onChange={(event) => setMaxInstallments(event.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveSettings.isPending}>
          Salvar regras financeiras
        </Button>
      </div>
    </div>
  );
};
