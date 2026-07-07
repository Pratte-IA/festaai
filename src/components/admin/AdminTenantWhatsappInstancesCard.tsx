import { MessageCircle, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAutomationsForConnection,
  type AdminTenantWhatsappOverview,
} from "@/features/admin/use-admin-tenant-whatsapp-overview";
import { formatIsoDateBR } from "@/lib/date";

const statusVariant = (status: string) => {
  if (status === "connected") return "default" as const;
  if (status === "connecting") return "secondary" as const;
  return "destructive" as const;
};

const statusLabel = (status: string) => {
  if (status === "connected") return "Conectado";
  if (status === "connecting") return "Conectando";
  if (status === "disconnected") return "Desconectado";
  if (status === "error") return "Erro";
  return status;
};

interface AdminTenantWhatsappInstancesCardProps {
  overview: AdminTenantWhatsappOverview;
  tenantName: string;
  tenantSlug: string;
}

export const AdminTenantWhatsappInstancesCard = ({
  overview,
  tenantName,
  tenantSlug,
}: AdminTenantWhatsappInstancesCardProps) => (
  <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-primary" />
        Instâncias WhatsApp
      </CardTitle>
      <CardDescription>
        Cliente: <strong>{tenantName}</strong> · slug <code className="text-xs">{tenantSlug}</code> · ID{" "}
        {overview.tenantId}. Cada linha é uma instância Evolution criada quando o tenant conectou um
        número.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {overview.connections.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma instância WhatsApp cadastrada para este tenant.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <div className="hidden grid-cols-[1.1fr_1.2fr_0.7fr_0.7fr_1fr] gap-4 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Rótulo</span>
            <span>Instância Evolution</span>
            <span>Telefone</span>
            <span>Status</span>
            <span>Automações neste número</span>
          </div>
          <div className="divide-y">
            {overview.connections.map((connection) => {
              const linkedAutomations = getAutomationsForConnection(connection.id, overview.automations);

              return (
                <article
                  className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.1fr_1.2fr_0.7fr_0.7fr_1fr] lg:items-start lg:gap-4"
                  key={connection.id}
                >
                  <div>
                    <p className="font-semibold text-foreground">{connection.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Conexão #{connection.id}
                      {connection.createdAt
                        ? ` · ${formatIsoDateBR(connection.createdAt.slice(0, 10))}`
                        : ""}
                    </p>
                  </div>
                  <p className="break-all font-mono text-xs text-muted-foreground lg:text-sm">
                    {connection.instanceName}
                  </p>
                  <p className="text-muted-foreground">{connection.phone?.trim() || "—"}</p>
                  <div>
                    <Badge variant={statusVariant(connection.status)}>
                      {statusLabel(connection.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedAutomations.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Nenhuma automação vinculada</span>
                    ) : (
                      linkedAutomations.map((automation) => (
                        <Badge key={automation.automationKey} variant="outline">
                          {automation.automationTitle}
                        </Badge>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 rounded-2xl border border-muted bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Confira se o <strong>tenant ID {overview.tenantId}</strong> ({tenantSlug}) bate com a instância
          Evolution. O nome da instância costuma incluir o slug do cliente.
        </p>
      </div>
    </CardContent>
  </Card>
);
