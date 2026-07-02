import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Bot, ExternalLink, Loader2, PlugZap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDefaultAutomationBindings,
  isAutomationBindingConfigured,
  useTenantAutomationSettings,
  useUpdateAutomationTemplateBindings,
  type AutomationTemplateBindingRow,
  type AutomationTemplateKey,
} from "@/features/automations";
import { useWhatsappConnections, type WhatsappConnection } from "@/features/whatsapp-connections";
import { toast } from "@/hooks/use-toast";
import { getBrazilMobilePhoneValidationError } from "@/lib/phone";
import { cn } from "@/lib/utils";

const UNASSIGNED_VALUE = "__none__";

const directionLabels = {
  inbound: "Recebe mensagens",
  outbound: "Envia mensagens",
} as const;

const formatConnectionLabel = (connection: WhatsappConnection) => {
  const phone = connection.phone?.trim();
  return phone ? `${connection.name} · ${phone}` : connection.name;
};

interface AutomationTemplateBindingRowProps {
  binding: AutomationTemplateBindingRow;
  connectionOptions: WhatsappConnection[];
  hasConnections: boolean;
  isSaving: boolean;
  onConnectionChange: (key: AutomationTemplateKey, connectionId: number | null) => void;
  onForwardPhoneChange: (key: AutomationTemplateKey, forwardPhone: string | null) => void;
}

const AutomationTemplateBindingRow = ({
  binding,
  connectionOptions,
  hasConnections,
  isSaving,
  onConnectionChange,
  onForwardPhoneChange,
}: AutomationTemplateBindingRowProps) => {
  const [phoneDraft, setPhoneDraft] = useState(binding.forwardPhone ?? "");
  const selectedConnection = connectionOptions.find(
    (connection) => connection.id === binding.connectionId,
  );

  useEffect(() => {
    setPhoneDraft(binding.forwardPhone ?? "");
  }, [binding.forwardPhone]);

  const handlePhoneBlur = () => {
    const trimmed = phoneDraft.trim();

    if (!trimmed) {
      onForwardPhoneChange(binding.key, null);
      return;
    }

    const validationError = getBrazilMobilePhoneValidationError(trimmed);
    if (validationError) {
      toast({
        title: "Celular inválido",
        description: validationError,
        variant: "destructive",
      });
      setPhoneDraft(binding.forwardPhone ?? "");
      return;
    }

    onForwardPhoneChange(binding.key, trimmed);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{binding.title}</p>
          <Badge variant="outline" className="text-xs">
            {binding.bindingMode === "phone_number"
              ? "Número particular"
              : directionLabels[binding.direction]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{binding.description}</p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-72">
        {binding.bindingMode === "phone_number" ? (
          <>
            <PhoneInput
              aria-label={`Celular do vendedor para ${binding.title}`}
              disabled={isSaving}
              value={phoneDraft}
              onChange={setPhoneDraft}
              onBlur={handlePhoneBlur}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              placeholder="(45) 99999-9999"
            />
            <p className="text-xs text-muted-foreground">Celular pessoal do vendedor, com DDD.</p>
          </>
        ) : (
          <>
            <Select
              disabled={isSaving || !hasConnections}
              value={binding.connectionId ? String(binding.connectionId) : UNASSIGNED_VALUE}
              onValueChange={(value) => {
                onConnectionChange(
                  binding.key,
                  value === UNASSIGNED_VALUE ? null : Number(value),
                );
              }}
            >
              <SelectTrigger aria-label={`Conexão para ${binding.title}`}>
                <SelectValue
                  placeholder={
                    hasConnections ? "Selecione um número" : "Conecte um WhatsApp primeiro"
                  }
                />
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

            {!hasConnections && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Cadastre uma conexão WhatsApp na etapa anterior.
              </p>
            )}

            {selectedConnection && selectedConnection.status !== "connected" && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Conexão ainda não está ativa.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const useAutomationTemplateBindingsManager = () => {
  const { data: settings, error, isLoading } = useTenantAutomationSettings();
  const { data: connections = [], isLoading: isLoadingConnections } = useWhatsappConnections();
  const updateBindings = useUpdateAutomationTemplateBindings();
  const [localBindings, setLocalBindings] = useState<AutomationTemplateBindingRow[]>(
    createDefaultAutomationBindings,
  );

  useEffect(() => {
    if (settings?.automationBindings) {
      setLocalBindings(settings.automationBindings);
    }
  }, [settings?.automationBindings]);

  const linkedCount = useMemo(
    () => localBindings.filter(isAutomationBindingConfigured).length,
    [localBindings],
  );

  const allConfigured = useMemo(
    () => localBindings.every(isAutomationBindingConfigured),
    [localBindings],
  );

  const persistBindings = async (
    nextBindings: AutomationTemplateBindingRow[],
    previousBindings: AutomationTemplateBindingRow[],
    successDescription: string,
  ) => {
    setLocalBindings(nextBindings);

    try {
      await updateBindings.mutateAsync(nextBindings);
      toast({
        title: "Configuração salva",
        description: successDescription,
      });
    } catch (updateError) {
      setLocalBindings(previousBindings);
      toast({
        title: "Não foi possível salvar",
        description:
          updateError instanceof Error ? updateError.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleConnectionChange = async (key: AutomationTemplateKey, connectionId: number | null) => {
    const previousBindings = localBindings;
    const nextBindings = localBindings.map((binding) =>
      binding.key === key ? { ...binding, connectionId } : binding,
    );

    await persistBindings(
      nextBindings,
      previousBindings,
      "A automação foi associada ao número selecionado.",
    );
  };

  const handleForwardPhoneChange = async (
    key: AutomationTemplateKey,
    forwardPhone: string | null,
  ) => {
    const previousBindings = localBindings;
    const nextBindings = localBindings.map((binding) =>
      binding.key === key ? { ...binding, forwardPhone } : binding,
    );

    await persistBindings(
      nextBindings,
      previousBindings,
      forwardPhone
        ? "O celular do vendedor foi salvo."
        : "O celular do vendedor foi removido.",
    );
  };

  return {
    allConfigured,
    connections,
    error,
    handleConnectionChange,
    handleForwardPhoneChange,
    hasConnections: connections.length > 0,
    isLoading,
    isLoadingConnections,
    isSaving: updateBindings.isPending,
    linkedCount,
    localBindings,
    settings,
  };
};

export type AutomationTemplateBindingsManager = ReturnType<
  typeof useAutomationTemplateBindingsManager
>;

interface AutomationTemplateBindingsPanelProps {
  manager: AutomationTemplateBindingsManager;
  showCardHeader?: boolean;
  showSettingsWhatsappLink?: boolean;
  showN8nEditorLink?: boolean;
}

export const AutomationTemplateBindingsPanel = ({
  manager,
  showCardHeader = true,
  showSettingsWhatsappLink = true,
  showN8nEditorLink = true,
}: AutomationTemplateBindingsPanelProps) => {
  const {
    connections,
    error,
    handleConnectionChange,
    handleForwardPhoneChange,
    hasConnections,
    isLoading,
    isLoadingConnections,
    isSaving,
    localBindings,
    settings,
  } = manager;

  return (
    <Card>
      {showCardHeader ? (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            Automações disponíveis
          </CardTitle>
          <CardDescription>
            Vincule cada automação ao WhatsApp da casa ou informe o celular particular do vendedor,
            quando aplicável.
          </CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className={cn("space-y-4", !showCardHeader && "pt-6")}>
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
            {!hasConnections && !isLoadingConnections && showSettingsWhatsappLink && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="font-medium text-foreground">Nenhuma conexão WhatsApp cadastrada</p>
                <p className="mt-1 text-muted-foreground">
                  Conecte números da casa para as automações de envio e recebimento. O campo
                  &quot;Passar para o Vendedor&quot; aceita celular particular e já pode ser
                  preenchido.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
                  <Link to="/configuracoes/integracoes/whatsapp">
                    <PlugZap className="h-4 w-4" />
                    Conectar WhatsApp
                  </Link>
                </Button>
              </div>
            )}

            {!hasConnections && !isLoadingConnections && !showSettingsWhatsappLink && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                Conecte um número WhatsApp na etapa anterior para vincular as automações de envio e
                recebimento. O celular do vendedor pode ser preenchido abaixo.
              </div>
            )}

            <div className="space-y-3">
              {localBindings.map((binding) => (
                <AutomationTemplateBindingRow
                  key={binding.key}
                  binding={binding}
                  connectionOptions={connections}
                  hasConnections={hasConnections}
                  isSaving={isSaving}
                  onConnectionChange={handleConnectionChange}
                  onForwardPhoneChange={handleForwardPhoneChange}
                />
              ))}
            </div>

            {showN8nEditorLink && settings?.n8nEditorUrl && (
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
  );
};
