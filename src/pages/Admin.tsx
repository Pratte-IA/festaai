import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Clock, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminTenantsQueryKey } from "@/features/admin";
import { Tenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

type AdminTenantQueryRow = Tenant & {
  tenant_automation_settings:
    | { system_armed: boolean | null }
    | { system_armed: boolean | null }[]
    | null;
};

const activeStatuses = new Set(["active", "trialing"]);
const inactiveStatuses = new Set(["canceled", "suspended"]);

const fetchAdminTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, document, phone, email, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .returns<AdminTenantQueryRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
};

const SummaryCard = ({
  href,
  icon: Icon,
  label,
  value,
}: {
  href?: string;
  icon: typeof Building2;
  label: string;
  value: number | string;
}) => {
  const content = (
    <Card className="rounded-2xl border-white/80 bg-white/90 transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-center gap-2 text-3xl">
          <Icon className="h-6 w-6 text-primary" />
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );

  if (!href) {
    return content;
  }

  return <Link to={href}>{content}</Link>;
};

const Admin = () => {
  const { data: tenants = [], isLoading } = useQuery({
    queryFn: fetchAdminTenants,
    queryKey: adminTenantsQueryKey,
    staleTime: 1000 * 60,
  });

  const statusSummary = useMemo(() => {
    const activeCount = tenants.filter((tenant) => activeStatuses.has(tenant.status)).length;
    const inactiveCount = tenants.filter((tenant) => inactiveStatuses.has(tenant.status)).length;

    return {
      activeCount,
      inactiveCount,
      otherCount: tenants.length - activeCount - inactiveCount,
    };
  }, [tenants]);

  return (
    <main className="px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <img
            alt="Festa AI"
            className="h-16 w-auto object-contain object-left sm:h-20"
            src="/horizontal-festaai.svg"
          />
        </header>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              href="/admin/clientes"
              icon={Building2}
              label="Total de clientes"
              value={isLoading ? "..." : tenants.length}
            />
            <SummaryCard
              href="/admin/clientes"
              icon={Users}
              label="Clientes ativos"
              value={isLoading ? "..." : statusSummary.activeCount}
            />
            <SummaryCard
              href="/admin/clientes"
              icon={Clock}
              label="Clientes inativos"
              value={isLoading ? "..." : statusSummary.inactiveCount}
            />
            <SummaryCard
              href="/admin/clientes"
              icon={ShieldCheck}
              label="Outros status"
              value={isLoading ? "..." : statusSummary.otherCount}
            />
          </section>
        </div>
      </div>
    </main>
  );
};

export default Admin;
