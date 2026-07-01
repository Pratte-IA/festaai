import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Bot, ExternalLink, Loader2, PlugZap } from "lucide-react";

import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUTOMATION_TEMPLATE_CATALOG,
  useTenantAutomationSettings,
  useUpdateAutomationTemplateBindings,
  type AutomationTemplateBindingRow,
  type AutomationTemplateKey,
} from "@/features/automations";
import { useWhatsappConnections, type WhatsappConnection } from "@/features/whatsapp-connections";
import { toast } from "@/hooks/use-toast";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const UNASSIGNED_VALUE = "__none__";

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

const directionLabels = {
  inbound: "Recebe mensagens",
  outbound: "Envia mensagens",
} as const;

const formatConnectionLabel = (connection: WhatsappConnection) => {
  const phone = connection.phone?.trim();
  return phone ? `${connection.name} · ${phone}` : connection.name;
};

interface TemplateBindingRowProps {
  binding: AutomationTemplateBindingRow;
  connectionOptions: WhatsappConnection[];
  isSaving: boolean;
  onConnectionChange: (key: AutomationTemplateKey, connectionId: number | null) => void;
}

const TemplateBindingRow = ({
  binding,
  connectionOptions,
  isSaving,
  onConnectionChange,
}: TemplateBindingRowProps) => {
  const selectedConnection = connectionOptions.find(
    (connection) => connection.id === binding.connectionId,
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{binding.title}</p>
          <Badge variant="outline" className="text-xs">
            {directionLabels[binding.direction]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{binding.description}</p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-72">
        <Select
          disabled={isSaving}
          value={binding.connectionId ? String(binding.connectionId) : UNASSIGNED_VALUE}
          onValueChange={(value) => {
            onConnectionChange(
              binding.key,
              value === UNASSIGNED_VALUE ? null : Number(value),
            );
          }}
        >
          <SelectTrigger aria-label={`Conexão para ${binding.title}`}>
            <SelectValue placeholder="Selecione um número" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_VALUE}>Nenhum número vinculado</SelectItem>
            {connectionOptions.map((connection) => (
              <SelectItem key={connection.id} value={String(connection.id)}>
                {formatConnectionLabel(connection)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedConnection && selectedConnection.status !== "connected" && (
          <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Conexão ainda não está ativa.
          </p>
        )}
      </div>
    </div>
  );
};

const ConfiguracoesAutomacoes = () => {
  const meta = SETTINGS_PAGE_META.automacoes;
  const { data: settings, error, isLoading } = useTenantAutomationSettings();
  const { data: connections = [], isLoading: isLoadingConnections } = useWhatsappConnections();
  const updateBindings = useUpdateAutomationTemplateBindings();
  const [localBindings, setLocalBindings] = useState<AutomationTemplateBindingRow[]>(() =>
    AUTOMATION_TEMPLATE_CATALOG.map((template) => ({ ...template, connectionId: null })),
  );

  useEffect(() => {
    if (settings?.automationBindings) {
      setLocalBindings(settings.automationBindings);
    }
  }, [settings?.automationBindings]);

  const linkedCount = useMemo(
    () => localBindings.filter((binding) => binding.connectionId !== null).length,
    [localBindings],
  );

  const handleConnectionChange = async (key: AutomationTemplateKey, connectionId: number | null) => {
    const previousBindings = localBindings;
    const nextBindings = localBindings.map((binding) =>
      binding.key === key ? { ...binding, connectionId } : binding,
    );

    setLocalBindings(nextBindings);

    try {
      await updateBindings.mutateAsync(nextBindings);
      toast({
        title: "Vínculo atualizado",
        description: "A automação foi associada ao número selecionado.",
      });
    } catch (updateError) {
      setLocalBindings(previousBindings);
      toast({
        title: "Não foi possível salvar o vínculo",
        description:
          updateError instanceof Error ? updateError.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            Automações disponíveis
          </CardTitle>
          <CardDescription>
            Escolha qual número WhatsApp cada automação usa. Você pode usar números diferentes ou o
            mesmo número em mais de uma automação — cada casa de festas define como preferir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando automações...
            </div>
          )}

          {!isLoading && error && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Não foi possível carregar as automações."}
            </p>
          )}

          {!isLoading && !error && (
            <>
              {connections.length === 0 && !isLoadingConnections ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <p className="font-medium text-foreground">Nenhuma conexão WhatsApp cadastrada</p>
                  <p className="mt-1 text-muted-foreground">
                    Conecte pelo menos um número antes de vincular as automações.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
                    <Link to="/configuracoes/integracoes/whatsapp">
                      <PlugZap className="h-4 w-4" />
                      Conectar WhatsApp
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {localBindings.map((binding) => (
                    <TemplateBindingRow
                      key={binding.key}
                      binding={binding}
                      connectionOptions={connections}
                      isSaving={updateBindings.isPending}
                      onConnectionChange={handleConnectionChange}
                    />
                  ))}
                </div>
              )}

              {settings?.n8nEditorUrl && (
                <div className="pt-2">
                  <Button asChild variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground">
                    <a href={settings.n8nEditorUrl} target="_blank" rel="noreferrer">
                      Abrir pasta no editor N8N
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesAutomacoes;
