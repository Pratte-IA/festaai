import { Bot, Webhook } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdminTenantAutomationBindingView } from "@/features/admin/use-admin-tenant-whatsapp-overview";
import type { N8nAutomationWebhookKey } from "@/features/admin/admin-tenant-n8n-settings";

const formatInstanceLabel = (automation: AdminTenantAutomationBindingView) => {
  if (automation.bindingMode === "phone_number") {
    return automation.forwardPhone?.trim() || "Número não informado";
  }

  if (!automation.connection) {
    return "Nenhum WhatsApp vinculado pelo tenant";
  }

  const phone = automation.connection.phone?.trim();
  return phone
    ? `${automation.connection.name} · ${phone}`
    : automation.connection.name;
};

interface AdminTenantAutomationWorkflowCardProps {
  automation: AdminTenantAutomationBindingView;
  inboundAutomationEnabled?: boolean;
  onInboundAutomationEnabledChange?: (enabled: boolean) => void;
  onWebhookUrlChange?: (value: string) => void;
  webhookUrl?: string;
}

export const AdminTenantAutomationWorkflowCard = ({
  automation,
  inboundAutomationEnabled,
  onInboundAutomationEnabledChange,
  onWebhookUrlChange,
  webhookUrl,
}: AdminTenantAutomationWorkflowCardProps) => {
  const isN8nAutomation = automation.usesN8nWebhook;
  const n8nKey = automation.automationKey as N8nAutomationWebhookKey;

  return (
    <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            {automation.automationTitle}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              {automation.direction === "inbound" ? "Inbound" : "Outbound"}
            </Badge>
            {isN8nAutomation ? (
              <Badge variant="secondary">N8N</Badge>
            ) : (
              <Badge variant="secondary">WhatsApp direto</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3 rounded-2xl border bg-muted/10 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Workflow
            </p>
            <p className="mt-0.5 font-medium">{automation.automationTitle}</p>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Instância
            </p>
            <p className="mt-0.5 font-medium">{formatInstanceLabel(automation)}</p>
            {automation.connection ? (
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {automation.connection.instanceName}
              </p>
            ) : null}
          </div>

          <div className="border-t pt-3">
            <div className="mb-2 flex items-center gap-2">
              <Webhook className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Webhook N8N
              </p>
            </div>

            {isN8nAutomation && onWebhookUrlChange ? (
              <div className="space-y-3">
                <Input
                  id={`webhook-${n8nKey}`}
                  onChange={(event) => onWebhookUrlChange(event.target.value)}
                  placeholder="https://webhooks.pratte.com.br/webhook/..."
                  value={webhookUrl ?? ""}
                />
                {n8nKey === "atendimento" && onInboundAutomationEnabledChange ? (
                  <div className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5">
                    <Switch
                      checked={inboundAutomationEnabled ?? false}
                      id={`inbound-enabled-${n8nKey}`}
                      onCheckedChange={onInboundAutomationEnabledChange}
                    />
                    <div>
                      <Label className="text-sm" htmlFor={`inbound-enabled-${n8nKey}`}>
                        Encaminhar mensagens para este webhook
                      </Label>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Não usa N8N — dispara direto pelo WhatsApp vinculado.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
