import { ContratoSetupStep } from "@/components/guided-setup/ContratoSetupStep";
import { SettingsPageHeader } from "@/components/configuracoes/SettingsPageHeader";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const ConfiguracoesContrato = () => {
  const meta = SETTINGS_PAGE_META.contrato;

  return (
    <div className="max-w-6xl space-y-6">
      <SettingsPageHeader title={meta.title} description={meta.description} />
      <ContratoSetupStep mode="settings" />
    </div>
  );
};

export default ConfiguracoesContrato;
