import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Clock, Handshake, LifeBuoy, LogOut, Search, ShieldCheck, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminTenantsQueryKey, useSetTenantSystemArmed } from "@/features/admin";
import { useAuth } from "@/features/auth";
import { Tenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type StatusFilter = "all" | "active" | "inactive" | `status:${string}`;
type SortOption = "created-desc" | "created-asc" | "name-asc" | "name-desc";

type AdminTenantRow = Tenant & {
  system_armed: boolean;
};

type AdminTenantQueryRow = Tenant & {
  tenant_automation_settings:
    | { system_armed: boolean | null }
    | { system_armed: boolean | null }[]
    | null;
};

const activeStatuses = new Set(["active", "trialing"]);
const inactiveStatuses = new Set(["canceled", "suspended"]);

const resolveSystemArmed = (row: AdminTenantQueryRow): boolean => {
  const settings = row.tenant_automation_settings;
  if (!settings) return false;
  const value = Array.isArray(settings) ? settings[0] : settings;
  return value?.system_armed === true;
};

const fetchAdminTenants = async (): Promise<AdminTenantRow[]> => {
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, document, phone, email, status, created_at, updated_at, tenant_automation_settings(system_armed)",
    )
    .order("created_at", { ascending: false })
    .returns<AdminTenantQueryRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    document: row.document,
    phone: row.phone,
    email: row.email,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    system_armed: resolveSystemArmed(row),
  }));
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  return dateFormatter.format(new Date(value));
};

const getStatusVariant = (status: Tenant["status"]) => {
  if (status === "active" || status === "trialing") {
    return "default";
  }

  if (status === "past_due") {
    return "secondary";
  }

  return "destructive";
};

const normalizeText = (value: string | null | undefined) => value?.toLowerCase().trim() ?? "";

const matchesSearch = (tenant: AdminTenantRow, searchTerm: string) => {
  if (!searchTerm) {
    return true;
  }

  const searchableValues = [
    tenant.name,
    tenant.slug,
    tenant.email,
    tenant.document,
    tenant.phone,
  ];

  return searchableValues.some((value) => normalizeText(value).includes(searchTerm));
};

const matchesStatusFilter = (tenant: AdminTenantRow, statusFilter: StatusFilter) => {
  if (statusFilter === "all") {
    return true;
  }

  if (statusFilter === "active") {
    return activeStatuses.has(tenant.status);
  }

  if (statusFilter === "inactive") {
    return inactiveStatuses.has(tenant.status);
  }

  return tenant.status === statusFilter.replace("status:", "");
};

const sortTenants = (tenants: AdminTenantRow[], sortOption: SortOption) => {
  return [...tenants].sort((firstTenant, secondTenant) => {
    if (sortOption === "name-asc") {
      return firstTenant.name.localeCompare(secondTenant.name, "pt-BR");
    }

    if (sortOption === "name-desc") {
      return secondTenant.name.localeCompare(firstTenant.name, "pt-BR");
    }

    const firstCreatedAt = new Date(firstTenant.created_at).getTime();
    const secondCreatedAt = new Date(secondTenant.created_at).getTime();

    return sortOption === "created-asc"
      ? firstCreatedAt - secondCreatedAt
      : secondCreatedAt - firstCreatedAt;
  });
};

const SummaryCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number | string;
}) => (
  <Card className="rounded-2xl border-white/80 bg-white/90">
    <CardHeader className="pb-3">
      <CardDescription>{label}</CardDescription>
      <CardTitle className="flex items-center gap-2 text-3xl">
        <Icon className="h-6 w-6 text-primary" />
        {value}
      </CardTitle>
    </CardHeader>
  </Card>
);

const Admin = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("created-desc");
  const [pendingTenantId, setPendingTenantId] = useState<number | null>(null);
  const { data: tenants = [], error, isLoading } = useQuery({
    queryFn: fetchAdminTenants,
    queryKey: adminTenantsQueryKey,
    staleTime: 1000 * 60,
  });
  const setSystemArmed = useSetTenantSystemArmed();

  const availableStatuses = useMemo(
    () => [...new Set(tenants.map((tenant) => tenant.status))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [tenants],
  );

  const statusSummary = useMemo(() => {
    const activeCount = tenants.filter((tenant) => activeStatuses.has(tenant.status)).length;
    const inactiveCount = tenants.filter((tenant) => inactiveStatuses.has(tenant.status)).length;

    return {
      activeCount,
      inactiveCount,
      otherCount: tenants.length - activeCount - inactiveCount,
    };
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    const matchingTenants = tenants.filter(
      (tenant) => matchesSearch(tenant, normalizedSearchTerm) && matchesStatusFilter(tenant, statusFilter),
    );

    return sortTenants(matchingTenants, sortOption);
  }, [searchTerm, sortOption, statusFilter, tenants]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleToggleSystem = async (tenant: AdminTenantRow) => {
    const nextArmed = !tenant.system_armed;
    setPendingTenantId(tenant.id);

    try {
      await setSystemArmed.mutateAsync({ tenantId: tenant.id, armed: nextArmed });
      toast({
        title: nextArmed ? "Sistema ativado" : "Sistema desativado",
        description: nextArmed
          ? `${tenant.name}: automações e robôs liberados.`
          : `${tenant.name}: automações e robôs pausados.`,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar a ativação",
        description: toggleError instanceof Error ? toggleError.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setPendingTenantId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(81,88,231,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbf7ff_100%)] px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Voce esta no modo administrador da plataforma.
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Admin FestaAI</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gerencie os clientes da plataforma
            </p>
            {profile?.email && (
              <p className="mt-1 text-xs text-muted-foreground">Conectada como {profile.email}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline">
              <Link to="/admin/comercial">
                <Handshake className="mr-2 h-4 w-4" />
                Comercial
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/agent-requests">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Solicitações do agente
              </Link>
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={Building2} label="Total de clientes" value={isLoading ? "..." : tenants.length} />
          <SummaryCard icon={Users} label="Clientes ativos" value={isLoading ? "..." : statusSummary.activeCount} />
          <SummaryCard icon={Clock} label="Clientes inativos" value={isLoading ? "..." : statusSummary.inactiveCount} />
          <SummaryCard icon={ShieldCheck} label="Outros status" value={isLoading ? "..." : statusSummary.otherCount} />
        </section>

        <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Tenants cadastrados. Use Ativar sistema para liberar automações e robôs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nome, slug, e-mail, documento ou telefone"
                  value={searchTerm}
                />
              </div>
              <select
                aria-label="Filtrar por status"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                value={statusFilter}
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                {availableStatuses
                  .filter((status) => !activeStatuses.has(status) && !inactiveStatuses.has(status))
                  .map((status) => (
                    <option key={status} value={`status:${status}`}>
                      {status}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Ordenar clientes"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                value={sortOption}
              >
                <option value="created-desc">Mais recentes</option>
                <option value="created-asc">Mais antigos</option>
                <option value="name-asc">Nome A-Z</option>
                <option value="name-desc">Nome Z-A</option>
              </select>
            </div>

            {isLoading && (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Carregando clientes...
              </div>
            )}

            {!isLoading && error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Nao foi possivel carregar os clientes. Tente novamente em instantes.
              </div>
            )}

            {!isLoading && !error && tenants.length === 0 && (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum cliente cadastrado ainda.
              </div>
            )}

            {!isLoading && !error && tenants.length > 0 && filteredTenants.length === 0 && (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum cliente encontrado com os filtros atuais.
              </div>
            )}

            {!isLoading && !error && filteredTenants.length > 0 && (
              <div className="overflow-hidden rounded-2xl border">
                <div className="hidden grid-cols-[1.4fr_0.9fr_0.7fr_0.9fr_0.9fr_1fr_0.8fr] gap-4 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                  <span>Nome</span>
                  <span>Slug</span>
                  <span>Status</span>
                  <span>Criado em</span>
                  <span>Atualizado em</span>
                  <span>Ativar sistema</span>
                  <span className="text-right">Acoes</span>
                </div>
                <div className="divide-y">
                  {filteredTenants.map((tenant) => {
                    const isToggling = pendingTenantId === tenant.id && setSystemArmed.isPending;

                    return (
                      <article
                        className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.4fr_0.9fr_0.7fr_0.9fr_0.9fr_1fr_0.8fr] lg:items-center lg:gap-4"
                        key={tenant.id}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground lg:hidden">{tenant.slug}</p>
                          {tenant.email && <p className="text-xs text-muted-foreground">{tenant.email}</p>}
                        </div>
                        <p className="hidden text-muted-foreground lg:block">{tenant.slug}</p>
                        <div>
                          <Badge variant={getStatusVariant(tenant.status)}>{tenant.status}</Badge>
                        </div>
                        <p className="text-muted-foreground">{formatDateTime(tenant.created_at)}</p>
                        <p className="text-muted-foreground">{formatDateTime(tenant.updated_at)}</p>
                        <div className="flex items-center gap-2">
                          <Button
                            disabled={isToggling}
                            onClick={() => void handleToggleSystem(tenant)}
                            size="sm"
                            variant={tenant.system_armed ? "outline" : "default"}
                          >
                            {isToggling
                              ? "Salvando..."
                              : tenant.system_armed
                                ? "Desativar"
                                : "Ativar"}
                          </Button>
                          <Badge variant={tenant.system_armed ? "default" : "secondary"}>
                            {tenant.system_armed ? "Ativo" : "Off"}
                          </Badge>
                        </div>
                        <div className="lg:text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/admin/tenants/${tenant.id}`}>Abrir painel</Link>
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Admin;
