import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PropsWithChildren } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { setPlatformAdminViewingTenantId } from "@/features/admin/platform-admin-viewing";
import { useCurrentTenant } from "@/features/tenants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminTenant } from "@/features/admin";

interface AdminTenantShellProps extends PropsWithChildren {
  backHref: string;
  backLabel?: string;
  description?: string;
  tenantId: number;
  title: string;
}

const getStatusVariant = (status: string) => {
  if (status === "active" || status === "trialing") return "default" as const;
  if (status === "past_due") return "secondary" as const;
  return "destructive" as const;
};

export const AdminTenantShell = ({
  backHref,
  backLabel = "Voltar",
  children,
  description,
  tenantId,
  title,
}: AdminTenantShellProps) => {
  const { data: tenant, error, isLoading } = useAdminTenant(tenantId);
  const { currentTenantId, currentUnit, currentUnitId, setCurrentTenantId, setCurrentUnitId, units } =
    useCurrentTenant();

  useEffect(() => {
    if (!Number.isInteger(tenantId) || tenantId <= 0) return;
    if (currentTenantId === tenantId) return;

    setPlatformAdminViewingTenantId(tenantId, currentTenantId);
    setCurrentTenantId(tenantId);
  }, [currentTenantId, setCurrentTenantId, tenantId]);

  const houseUnits = units.filter((unit) => unit.tenant_id === tenantId && unit.status === "active");

  return (
    <main className="px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Button asChild className="w-fit" variant="outline">
          <Link to={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin FestaAI — Cliente
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {description ? (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              ) : null}
              {tenant ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {tenant.name} · {tenant.slug}
                </p>
              ) : null}
            </div>
            {tenant ? <Badge variant={getStatusVariant(tenant.status)}>{tenant.status}</Badge> : null}
          </div>
          {houseUnits.length > 0 ? (
            <div className="mt-4 max-w-xs space-y-2">
              <Label htmlFor="admin-tenant-unit">Casa</Label>
              <Select
                value={currentUnitId ? String(currentUnitId) : undefined}
                onValueChange={(value) => setCurrentUnitId(Number(value))}
              >
                <SelectTrigger id="admin-tenant-unit">
                  <SelectValue placeholder="Selecione a casa" />
                </SelectTrigger>
                <SelectContent>
                  {houseUnits.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.kind === "matriz" ? "Matriz" : "Filial"} · {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentUnit ? (
                <p className="text-xs text-muted-foreground">
                  A configuração abaixo vale só para {currentUnit.name}.
                </p>
              ) : null}
            </div>
          ) : null}
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed bg-white/80 p-8 text-center text-sm text-muted-foreground">
            Carregando cliente...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar este cliente.
          </div>
        ) : null}

        {!isLoading && !error ? children : null}
      </div>
    </main>
  );
};
