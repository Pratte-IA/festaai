import { Link } from "react-router-dom";
import { ClipboardList, FileText, Handshake, Kanban, Radar, Users } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCommercialLeads, useAdminCommercialOffers } from "@/features/comercial";

const AdminComercial = () => {
  const { data: leads = [] } = useAdminCommercialLeads("novo");
  const { data: offers = [] } = useAdminCommercialOffers("active");

  const modules = [
    {
      description: "Prospecção e acompanhamento de empresas mapeadas pelo radar comercial.",
      href: "/admin/radar",
      icon: Radar,
      stat: "Abrir radar",
      title: "Radar Comercial",
    },
    {
      description: "Funil comercial com Kanban para acompanhar o avanço das oportunidades do Radar.",
      href: "/admin/crm",
      icon: Kanban,
      stat: "Abrir CRM",
      title: "CRM Comercial",
    },
    {
      description: "Solicitações do card Plano sob medida na página de contratação.",
      href: "/admin/comercial/leads",
      icon: Users,
      stat: `${leads.length} novos`,
      title: "Leads comerciais",
    },
    {
      description: "Crie propostas personalizadas e copie links exclusivos para formalização.",
      href: "/admin/comercial/ofertas",
      icon: Handshake,
      stat: `${offers.length} ativas`,
      title: "Ofertas privadas",
    },
    {
      description: "Aceites eletrônicos com IP e assinaturas de billing.",
      href: "/admin/comercial/contratos",
      icon: FileText,
      stat: "Ver todos",
      title: "Contratos",
    },
  ];

  return (
    <AdminPageShell
      description="Gerencie leads, propostas comerciais e contratos da plataforma FestaAI."
      title="Comercial"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Fluxo recomendado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Lead preenche o card &quot;Plano sob medida&quot; em /contratar.</p>
          <p>2. Você negocia fora da plataforma e cria uma oferta com preços fechados.</p>
          <p>3. Envia o link /contratar/oferta/:token para o cliente formalizar e pagar.</p>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
};

export default AdminComercial;
