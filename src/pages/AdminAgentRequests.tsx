import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AGENT_STATUS_VALUES,
  AGENT_URGENCY_VALUES,
  agentBillingStatusLabels,
  agentStatusLabels,
  agentUrgencyLabels,
  useAdminAgentChangeRequests,
} from "@/features/agent-change-requests";
import { Tenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

const fetchAdminTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, document, phone, email, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .returns<Tenant[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type ListRow = {
  billing_status: string;
  created_at: string;
  estimated_price: number | null;
  id: number;
  status: string;
  tenant_id: number;
  tenants: { name: string; slug: string } | null;
  title: string;
  urgency: string;
};

const AdminAgentRequests = () => {
  const [searchParams] = useSearchParams();
  const tenantFromUrl = searchParams.get("tenantId") ?? "all";

  const [status, setStatus] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [tenantId, setTenantId] = useState<string>(tenantFromUrl);

  useEffect(() => {
    setTenantId(tenantFromUrl);
  }, [tenantFromUrl]);

  const filters = useMemo(
    () => ({
      status,
      tenantId,
      urgency,
    }),
    [status, tenantId, urgency],
  );

  const { data: tenants = [] } = useQuery({
    queryFn: fetchAdminTenants,
    queryKey: ["admin", "tenants"],
    staleTime: 1000 * 60,
  });

  const { data: rows = [], error, isLoading } = useAdminAgentChangeRequests(filters);

  return (
    <AdminPageShell
      description="Fila global de pedidos de ajuste; filtre por cliente, status ou urgência."
      title="Solicitações do agente"
    >
      <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use o parâmetro <span className="font-mono text-xs">tenantId</span> na URL para abrir já filtrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="flt-tenant">
                  Cliente
                </label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="flt-tenant"
                  onChange={(e) => setTenantId(e.target.value)}
                  value={tenantId}
                >
                  <option value="all">Todos</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="flt-status">
                  Status
                </label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="flt-status"
                  onChange={(e) => setStatus(e.target.value)}
                  value={status}
                >
                  <option value="all">Todos</option>
                  {AGENT_STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {agentStatusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="flt-urgency">
                  Urgência
                </label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="flt-urgency"
                  onChange={(e) => setUrgency(e.target.value)}
                  value={urgency}
                >
                  <option value="all">Todas</option>
                  {AGENT_URGENCY_VALUES.map((u) => (
                    <option key={u} value={u}>
                      {agentUrgencyLabels[u]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading && (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
            )}

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Não foi possível carregar solicitações.
              </p>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro com estes filtros.</p>
            )}

            {!isLoading && !error && rows.length > 0 && (
              <div className="overflow-hidden rounded-2xl border">
                <div className="hidden grid-cols-[1fr_1fr_0.9fr_0.7fr_0.9fr_0.7fr] gap-3 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                  <span>Cliente</span>
                  <span>Título</span>
                  <span>Status</span>
                  <span>Urgência</span>
                  <span>Cobrança</span>
                  <span className="text-right">Ações</span>
                </div>
                <div className="divide-y">
                  {(rows as ListRow[]).map((row) => (
                    <article
                      className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1fr_1fr_0.9fr_0.7fr_0.9fr_0.7fr] lg:items-center"
                      key={row.id}
                    >
                      <div>
                        <p className="font-semibold">{row.tenants?.name ?? `Tenant #${row.tenant_id}`}</p>
                        <p className="text-xs text-muted-foreground">{row.tenants?.slug}</p>
                      </div>
                      <p className="min-w-0 break-words text-foreground">{row.title}</p>
                      <div>
                        <Badge variant="secondary">
                          {agentStatusLabels[row.status as keyof typeof agentStatusLabels] ?? row.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {agentUrgencyLabels[row.urgency as keyof typeof agentUrgencyLabels] ?? row.urgency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {agentBillingStatusLabels[row.billing_status as keyof typeof agentBillingStatusLabels] ??
                          row.billing_status}
                        {row.estimated_price != null && (
                          <span className="ml-1 tabular-nums">
                            ·{" "}
                            {new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(
                              Number(row.estimated_price),
                            )}
                          </span>
                        )}
                      </p>
                      <div className="flex justify-end">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/agent-requests/${row.id}`}>Abrir</Link>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground lg:col-span-6">
                        Criada em {dateFormatter.format(new Date(row.created_at))}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </AdminPageShell>
  );
};

export default AdminAgentRequests;
