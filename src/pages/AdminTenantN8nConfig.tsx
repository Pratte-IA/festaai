import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useParams } from "react-router-dom";

import { AdminTenantAutomationWorkflowCard } from "@/components/admin/AdminTenantAutomationWorkflowCard";
import { AdminTenantWhatsappInstancesCard } from "@/components/admin/AdminTenantWhatsappInstancesCard";
import { AdminTenantShell } from "@/components/admin/AdminTenantShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  buildDefaultAdminTenantN8nSettingsForm,
  type AdminTenantN8nSettingsForm,
  type N8nAutomationWebhookKey,
} from "@/features/admin/admin-tenant-n8n-settings";
import {
  useAdminTenant,
  useAdminTenantN8nSettings,
  useAdminTenantWhatsappOverview,
  useSaveAdminTenantN8nSettings,
} from "@/features/admin";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-message";

const AdminTenantN8nConfig = () => {
  const { id } = useParams();
  const tenantId = Number(id);
  const hasValidTenantId = Number.isInteger(tenantId) && tenantId > 0;
  const { data: tenant } = useAdminTenant(hasValidTenantId ? tenantId : null);
  const { data, error, isLoading } = useAdminTenantN8nSettings(hasValidTenantId ? tenantId : null);
  const {
    data: whatsappOverview,
    error: whatsappError,
    isLoading: isWhatsappLoading,
  } = useAdminTenantWhatsappOverview(hasValidTenantId ? tenantId : null);
  const saveSettings = useSaveAdminTenantN8nSettings(hasValidTenantId ? tenantId : null);
  const [form, setForm] = useState<AdminTenantN8nSettingsForm>(buildDefaultAdminTenantN8nSettingsForm());

  useEffect(() => {
    if (data?.form) {
      setForm(data.form);
    }
  }, [data?.form]);

  if (!hasValidTenantId) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await saveSettings.mutateAsync(form);
      toast({
        title: "Webhooks salvos",
        description: "As URLs de disparo foram gravadas para este tenant.",
      });
    } catch (submitError) {
      toast({
        title: "Erro ao salvar",
        description: getErrorMessage(submitError, "Não foi possível salvar os webhooks."),
        variant: "destructive",
      });
    }
  };

  const updateWebhookUrl = (key: N8nAutomationWebhookKey, value: string) => {
    setForm((current) => ({
      ...current,
      webhookUrls: {
        ...current.webhookUrls,
        [key]: value,
      },
    }));
  };

  const isPageLoading = isLoading || isWhatsappLoading;

  return (
    <AdminTenantShell
      backHref={`/admin/tenants/${tenantId}`}
      backLabel="Voltar ao painel do cliente"
      description="Instâncias WhatsApp do tenant e configuração de cada automação — workflow, instância e webhook N8N."
      tenantId={tenantId}
      title="Automações e Webhooks"
    >
      {isPageLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed bg-white/80 p-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando instâncias e webhooks...
        </div>
      ) : null}

      {!isPageLoading && (error || whatsappError) ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar os dados deste tenant.
        </div>
      ) : null}

      {!isPageLoading && !error && !whatsappError && whatsappOverview && tenant ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <AdminTenantWhatsappInstancesCard
            overview={whatsappOverview}
            tenantName={tenant.name}
            tenantSlug={tenant.slug}
          />

          {data?.n8nLastError ? (
            <Card className="rounded-3xl border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base text-destructive">Último erro registrado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-background/80 p-4 text-sm">
                  {data.n8nLastError}
                </pre>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.clearLastError}
                    id="clear-last-error"
                    onCheckedChange={(checked) =>
                      setForm((current) => ({ ...current, clearLastError: checked }))
                    }
                  />
                  <Label htmlFor="clear-last-error">Limpar erro ao salvar</Label>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            {whatsappOverview.automations.map((automation) => {
              const n8nKey = automation.automationKey as N8nAutomationWebhookKey;
              const isN8n = automation.usesN8nWebhook;

              return (
                <AdminTenantAutomationWorkflowCard
                  automation={automation}
                  inboundAutomationEnabled={
                    isN8n && n8nKey === "atendimento" ? form.inboundAutomationEnabled : undefined
                  }
                  key={automation.automationKey}
                  onInboundAutomationEnabledChange={
                    isN8n && n8nKey === "atendimento"
                      ? (enabled) =>
                          setForm((current) => ({ ...current, inboundAutomationEnabled: enabled }))
                      : undefined
                  }
                  onWebhookUrlChange={
                    isN8n ? (value) => updateWebhookUrl(n8nKey, value) : undefined
                  }
                  webhookUrl={isN8n ? form.webhookUrls[n8nKey] : undefined}
                />
              );
            })}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.configuredWebhookCount ?? 0} webhook(s) N8N configurado(s) ·{" "}
              {whatsappOverview.connections.length} instância(s) WhatsApp ·{" "}
              {whatsappOverview.automations.length} automação(ões).
            </p>
            <Button disabled={saveSettings.isPending} type="submit">
              {saveSettings.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar webhooks
            </Button>
          </div>
        </form>
      ) : null}
    </AdminTenantShell>
  );
};

export default AdminTenantN8nConfig;
