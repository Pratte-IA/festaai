import { PaymentMethodsConfig } from "@/components/formulario-contratacao/PaymentMethodsConfig";
import { FinancialSettingsConfig } from "@/pages/configuracoes/financial-settings-config";

export const PaymentTab = () => (
  <div className="space-y-8">
    <p className="text-sm text-muted-foreground">
      Defina os métodos de pagamento aceitos e as regras financeiras globais do espaço.
    </p>
    <PaymentMethodsConfig />
    <div className="border-t border-border/40 pt-8">
      <FinancialSettingsConfig />
    </div>
  </div>
);
