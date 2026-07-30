import { Link } from "react-router-dom";
import { ListFilter, Sparkles } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDefaultRadarFilters, useRadarCompanyList } from "@/features/radar-crm";

const DEFAULT_FILTERS = createDefaultRadarFilters();

const AdminRadar = () => {
  const { data: listResult, isLoading } = useRadarCompanyList(DEFAULT_FILTERS);
  const total = listResult?.total ?? 0;

  const modules = [
    {
      description: "Configure cidade, segmento e termos para o motor de prospecção encontrar novas empresas.",
      href: "/admin/radar/gerar",
      icon: Sparkles,
      stat: "Iniciar pesquisa",
      title: "Gerar Novos Leads",
    },
    {
      description: "Explore a base já qualificada com filtros por cidade, categoria, status e contatos.",
      href: "/admin/radar/consultar",
      icon: ListFilter,
      stat: isLoading ? "Carregando..." : `${total} empresa${total === 1 ? "" : "s"}`,
      title: "Consultar Leads",
    },
  ];

  return (
    <AdminPageShell
      description="Prospecção e consulta de empresas qualificadas pelo Radar."
      title="Radar Comercial"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map(({ description, href, icon: Icon, stat, title }) => (
          <Link key={href} to={href}>
            <Card className="h-full rounded-2xl border-white/80 bg-white/90 transition-shadow hover:shadow-md">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {title}
                </CardDescription>
                <CardTitle className="text-lg">{stat}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AdminPageShell>
  );
};

export default AdminRadar;
