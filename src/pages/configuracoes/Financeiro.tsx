import { FinancialSettingsConfig } from "./financial-settings-config";
import { SettingsSection } from "./settings-section";

const ConfiguracoesFinanceiro = () => (
  <div className="max-w-6xl">
    <SettingsSection title="Regras padrão">
      <FinancialSettingsConfig />
    </SettingsSection>
  </div>
);

export default ConfiguracoesFinanceiro;
