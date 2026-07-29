import { Building2, ExternalLink, LifeBuoy, Settings2, Workflow } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AdminTenantShell } from "@/components/admin/AdminTenantShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminTenantN8nSettings, useAdminTenantWhatsappOverview, useEnterTenantPlatform } from "@/features/admin";

const AdminTenantDetail = () => {
  const { id } = useParams();
  const tenantId = Number(id);
  const hasValidTenantId = Number.isInteger(tenantId) && tenantId > 0;
  const enterTenantPlatform = useEnterTenantPlatform();
  const { data: n8nSettings } = useAdminTenantN8nSettings(tenantId);
  const { data: whatsappOverview } = useAdminTenantWhatsappOverview(tenantId);

  if (!hasValidTenantId) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Button asChild variant="outline">
            <Link to="/admin/clientes">Voltar para Admin</Link>
          </Button>
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            ID do cliente inválido.
          </div>
        </div>
      </main>
    );
  }

  return (
    <AdminTenantShell
      backHref="/admin/clientes"
      backLabel="Voltar para Clientes"
      description="Escolha como deseja atuar neste cliente."
      tenantId={tenantId}
      title="Painel do cliente"
    >
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ExternalLink className="h-5 w-5" />
            </div>
            <CardTitle>Acessar a plataforma do cliente</CardTitle>
            <CardDescription>
              Entre no CRM e demais módulos deste tenant para consultar leads, festas e eventos quando
              precisar validar ou corrigir informações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              O acesso como admin da plataforma é principalmente para visualização. Alterações diretas no
              CRM podem estar limitadas pelas permissões atuais.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => enterTenantPlatform(tenantId, "/crm")}>
                Abrir CRM do cliente
              </Button>
              <Button onClick={() => enterTenantPlatform(tenantId, "/")} variant="outline">
                Abrir painel principal
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <CardTitle>Configuração do tenant</CardTitle>
            <CardDescription>
              Consulte pacotes, adicionais e todas as etapas da configuração guiada para montar o agente
              deste cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full sm:w-auto">
              <Link to={`/admin/tenants/${tenantId}/configuracao`}>
                Ver configurações
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Workflow className="h-5 w-5" />
            </div>
            <CardTitle>Automações e Webhooks</CardTitle>
            <CardDescription>
              Instâncias WhatsApp do tenant, vínculos por automação e URLs N8N — tudo em um lugar para
              validar o cliente correto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resumo
              </p>
              <p className="mt-1 font-medium">
                {n8nSettings?.configuredWebhookCount ?? 0} webhook(s) N8N ·{" "}
                {whatsappOverview?.connections.length ?? "—"} instância(s) WhatsApp
              </p>
              {n8nSettings?.n8nLastError ? (
                <p className="mt-2 text-xs text-destructive line-clamp-2">{n8nSettings.n8nLastError}</p>
              ) : null}
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link to={`/admin/tenants/${tenantId}/n8n`}>Ver automações e webhooks</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <CardTitle>Solicitações do agente</CardTitle>
            <CardDescription>Acompanhe pedidos de ajuste enviados por este tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={`/admin/agent-requests?tenantId=${tenantId}`}>Abrir solicitações</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle>Atalhos úteis</CardTitle>
            <CardDescription>Acesso rápido às áreas mais usadas na operação do cliente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => enterTenantPlatform(tenantId, "/configuracao-inicial")}
            >
              Configuração guiada
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => enterTenantPlatform(tenantId, "/configuracoes/pacotes")}
            >
              Pacotes
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => enterTenantPlatform(tenantId, "/configuracoes/adicionais")}
            >
              Adicionais
            </Button>
          </CardContent>
        </Card>
      </section>
    </AdminTenantShell>
  );
};

export default AdminTenantDetail;
