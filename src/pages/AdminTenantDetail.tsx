import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CreditCard, ExternalLink, LifeBuoy, ListChecks, ShieldCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminTenantBilling } from "@/features/comercial";
import { formatIsoDateBR, getTodayIsoDate } from "@/lib/date";
import { Tables } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

type TenantRow = Tables<"tenants">;
type TenantMemberRow = Tables<"tenant_members">;
type ProfileRow = Pick<Tables<"profiles">, "full_name" | "id" | "phone">;
type UpcomingEvento = Pick<
  Tables<"eventos">,
  "cliente_nome" | "data_evento" | "etapa" | "hora_evento" | "id" | "tipo_evento"
>;

interface MemberWithProfile extends TenantMemberRow {
  profile: ProfileRow | null;
}

interface OperationalSummary {
  distinctFunnels: number | null;
  distinctStages: number | null;
  errors: string[];
  totalEventos: number | null;
  totalLeads: number | null;
  totalPagamentos: number | null;
  totalTarefas: number | null;
  upcomingEventos: UpcomingEvento[];
}

interface TenantDetailData {
  members: MemberWithProfile[];
  summary: OperationalSummary;
  tenant: TenantRow;
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const getStatusVariant = (status: string) => {
  if (status === "active" || status === "trialing") {
    return "default";
  }

  if (status === "past_due") {
    return "secondary";
  }

  return "destructive";
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return dateTimeFormatter.format(new Date(value));
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return formatIsoDateBR(value);
};

const todayIsoDate = () => getTodayIsoDate();

const countOrNull = (count: number | null) => count ?? 0;

const fetchTenantMembers = async (tenantId: number): Promise<MemberWithProfile[]> => {
  const { data: members, error } = await supabase
    .from("tenant_members")
    .select("id, tenant_id, user_id, role, status, invited_by, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
    .returns<TenantMemberRow[]>();

  if (error) {
    throw error;
  }

  const userIds = [...new Set((members ?? []).map((member) => member.user_id))];

  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", userIds)
    .returns<ProfileRow[]>();

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (members ?? []).map((member) => ({
    ...member,
    profile: profilesById.get(member.user_id) ?? null,
  }));
};

const fetchOperationalSummary = async (tenantId: number): Promise<OperationalSummary> => {
  const errors: string[] = [];

  const [
    leadsResult,
    eventosResult,
    tarefasResult,
    pagamentosResult,
    funnelResult,
    upcomingResult,
  ] = await Promise.all([
    supabase
      .from("eventos")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("funil", "vendas"),
    supabase
      .from("eventos")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("tipo_evento", "festa"),
    supabase
      .from("evento_tarefas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("evento_pagamentos")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("eventos")
      .select("funil, etapa")
      .eq("tenant_id", tenantId),
    supabase
      .from("eventos")
      .select("id, cliente_nome, data_evento, hora_evento, tipo_evento, etapa")
      .eq("tenant_id", tenantId)
      .not("data_evento", "is", null)
      .gte("data_evento", todayIsoDate())
      .order("data_evento", { ascending: true })
      .limit(5)
      .returns<UpcomingEvento[]>(),
  ]);

  if (leadsResult.error) errors.push("Nao foi possivel carregar leads.");
  if (eventosResult.error) errors.push("Nao foi possivel carregar festas.");
  if (tarefasResult.error) errors.push("Nao foi possivel carregar tarefas.");
  if (pagamentosResult.error) errors.push("Nao foi possivel carregar pagamentos.");
  if (funnelResult.error) errors.push("Nao foi possivel carregar funis/etapas.");
  if (upcomingResult.error) errors.push("Nao foi possivel carregar proximos eventos.");

  const funnelRows = funnelResult.data ?? [];

  return {
    distinctFunnels: funnelResult.error ? null : new Set(funnelRows.map((row) => row.funil)).size,
    distinctStages: funnelResult.error ? null : new Set(funnelRows.map((row) => row.etapa)).size,
    errors,
    totalEventos: eventosResult.error ? null : countOrNull(eventosResult.count),
    totalLeads: leadsResult.error ? null : countOrNull(leadsResult.count),
    totalPagamentos: pagamentosResult.error ? null : countOrNull(pagamentosResult.count),
    totalTarefas: tarefasResult.error ? null : countOrNull(tarefasResult.count),
    upcomingEventos: upcomingResult.error ? [] : upcomingResult.data ?? [],
  };
};

const fetchTenantDetail = async (tenantId: number): Promise<TenantDetailData> => {
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, name, slug, document, phone, email, status, created_at, updated_at")
    .eq("id", tenantId)
    .maybeSingle<TenantRow>();

  if (error) {
    throw error;
  }

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const [members, summary] = await Promise.all([
    fetchTenantMembers(tenantId),
    fetchOperationalSummary(tenantId),
  ]);

  return {
    members,
    summary,
    tenant,
  };
};

const SummaryCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | null;
}) => (
  <Card className="rounded-2xl border-white/80 bg-white/90">
    <CardHeader className="pb-3">
      <CardDescription>{label}</CardDescription>
      <CardTitle className="flex items-center gap-2 text-3xl">
        <Icon className="h-6 w-6 text-primary" />
        {value ?? "-"}
      </CardTitle>
    </CardHeader>
  </Card>
);

const AdminTenantDetail = () => {
  const { id } = useParams();
  const tenantId = Number(id);
  const hasValidTenantId = Number.isInteger(tenantId) && tenantId > 0;

  const { data, error, isLoading } = useQuery({
    enabled: hasValidTenantId,
    queryFn: () => fetchTenantDetail(tenantId),
    queryKey: ["admin", "tenant-detail", tenantId],
    staleTime: 1000 * 60,
  });

  const { data: billingSubscription } = useAdminTenantBilling(hasValidTenantId ? tenantId : null);

  if (!hasValidTenantId) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Button asChild variant="outline">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Admin
            </Link>
          </Button>
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            ID do cliente invalido.
          </div>
        </div>
      </main>
    );
  }

  const tenant = data?.tenant;
  const summary = data?.summary;
  const members = data?.members ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(81,88,231,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbf7ff_100%)] px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Button asChild className="w-fit" variant="outline">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Admin
          </Link>
        </Button>

        <header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Modo administrador da plataforma - somente leitura
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? "Carregando cliente..." : tenant?.name ?? "Cliente nao encontrado"}
              </h1>
              {tenant && <p className="mt-2 text-sm text-muted-foreground">{tenant.slug}</p>}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {tenant && (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/admin/agent-requests?tenantId=${tenant.id}`}>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    Solicitações do agente
                  </Link>
                </Button>
              )}
              {tenant && <Badge variant={getStatusVariant(tenant.status)}>{tenant.status}</Badge>}
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-2xl border border-dashed bg-white/80 p-8 text-center text-sm text-muted-foreground">
            Carregando detalhes do cliente...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Nao foi possivel carregar este cliente.
          </div>
        )}

        {!isLoading && tenant && summary && (
          <>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={Users} label="Leads" value={summary.totalLeads} />
              <SummaryCard icon={CalendarDays} label="Festas" value={summary.totalEventos} />
              <SummaryCard icon={ListChecks} label="Tarefas" value={summary.totalTarefas} />
              <SummaryCard icon={CreditCard} label="Pagamentos" value={summary.totalPagamentos} />
            </section>

            <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Informações do cliente</CardTitle>
                <CardDescription>Dados cadastrais do tenant.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</p>
                  <p className="mt-1 font-medium">{tenant.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slug</p>
                  <p className="mt-1 font-medium">{tenant.slug}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documento</p>
                  <p className="mt-1 font-medium">{tenant.document ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</p>
                  <p className="mt-1 font-medium">{tenant.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telefone</p>
                  <p className="mt-1 font-medium">{tenant.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Criado em</p>
                  <p className="mt-1 font-medium">{formatDateTime(tenant.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Atualizado em</p>
                  <p className="mt-1 font-medium">{formatDateTime(tenant.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Contrato FestaAI</CardTitle>
                <CardDescription>Assinatura da plataforma vinculada a este cliente.</CardDescription>
              </CardHeader>
              <CardContent>
                {!billingSubscription ? (
                  <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                    Nenhuma assinatura FestaAI vinculada a este tenant.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plano</p>
                      <p className="mt-1 font-medium">
                        {(Array.isArray(billingSubscription.subscription_plans)
                          ? billingSubscription.subscription_plans[0]
                          : billingSubscription.subscription_plans
                        )?.name ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                      <Badge className="mt-1" variant={getStatusVariant(billingSubscription.status)}>
                        {billingSubscription.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Criado em</p>
                      <p className="mt-1 font-medium">{formatDateTime(billingSubscription.created_at)}</p>
                    </div>
                    {billingSubscription.checkout_url ? (
                      <div className="flex items-end">
                        <Button asChild size="sm" variant="outline">
                          <a href={billingSubscription.checkout_url} rel="noopener noreferrer" target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir checkout
                          </a>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Usuários vinculados</CardTitle>
                <CardDescription>Membros associados a este tenant.</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Nenhum usuário vinculado encontrado.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border">
                    <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                      <span>Usuário/Profile</span>
                      <span>Role</span>
                      <span>Status</span>
                      <span>Criado em</span>
                    </div>
                    <div className="divide-y">
                      {members.map((member) => (
                        <article
                          className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.4fr_1fr_1fr_1fr] md:items-center md:gap-4"
                          key={member.id}
                        >
                          <div>
                            <p className="font-semibold text-foreground">
                              {member.profile?.full_name ?? "Profile sem nome"}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.user_id}</p>
                            {member.profile?.phone && (
                              <p className="text-xs text-muted-foreground">{member.profile.phone}</p>
                            )}
                          </div>
                          <p className="text-muted-foreground">{member.role}</p>
                          <p className="text-muted-foreground">{member.status}</p>
                          <p className="text-muted-foreground">{formatDateTime(member.created_at)}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Resumo operacional</CardTitle>
                <CardDescription>Indicadores calculados a partir das tabelas existentes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {summary.errors.length > 0 && (
                  <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-muted-foreground">
                    Alguns dados do resumo nao puderam ser carregados: {summary.errors.join(" ")}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Funis distintos</p>
                    <p className="mt-2 text-2xl font-bold">{summary.distinctFunnels ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapas distintas</p>
                    <p className="mt-2 text-2xl font-bold">{summary.distinctStages ?? "-"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Próximos eventos</h3>
                  {summary.upcomingEventos.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                      Nenhum evento futuro encontrado.
                    </div>
                  ) : (
                    <div className="mt-3 divide-y rounded-2xl border">
                      {summary.upcomingEventos.map((evento) => (
                        <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1.3fr_1fr_1fr]" key={evento.id}>
                          <div>
                            <p className="font-semibold">{evento.cliente_nome}</p>
                            <p className="text-xs text-muted-foreground">{evento.etapa}</p>
                          </div>
                          <p className="text-muted-foreground">
                            {formatDate(evento.data_evento)} {evento.hora_evento ?? ""}
                          </p>
                          <p className="text-muted-foreground">{evento.tipo_evento}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
};

export default AdminTenantDetail;
