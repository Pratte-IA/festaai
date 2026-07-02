import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import {
  AutomationTemplateBindingsPanel,
  useAutomationTemplateBindingsManager,
} from "@/components/automations/AutomationTemplateBindingsPanel";
import { Badge } from "@/components/ui/badge";
import { AUTOMATION_TEMPLATE_CATALOG } from "@/features/automations";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const provisionStatusLabels = {
  active: "Ativo",
  draft: "Rascunho",
  error: "Erro",
} as const;

const provisionStatusVariant = {
  active: "default",
  draft: "secondary",
  error: "destructive",
} as const;

const ConfiguracoesAutomacoes = () => {
  const meta = SETTINGS_PAGE_META.automacoes;
  const manager = useAutomationTemplateBindingsManager();
  const { isLoading, linkedCount, settings } = manager;

  return (
    <div className="max-w-4xl space-y-4">
      <SettingsPageHeader
        title={meta.title}
        description={meta.description}
        stats={
          !isLoading ? (
            <>
              <SettingsStatChip>
                {AUTOMATION_TEMPLATE_CATALOG.length} automações disponíveis
              </SettingsStatChip>
              <SettingsStatChip>
                {linkedCount} {linkedCount === 1 ? "vínculo configurado" : "vínculos configurados"}
              </SettingsStatChip>
              {settings?.n8nProvisionStatus && (
                <Badge variant={provisionStatusVariant[settings.n8nProvisionStatus]}>
                  N8N: {provisionStatusLabels[settings.n8nProvisionStatus]}
                </Badge>
              )}
            </>
          ) : null
        }
      />

      <AutomationTemplateBindingsPanel manager={manager} />
    </div>
  );
};

export default ConfiguracoesAutomacoes;
