import { Link } from "react-router-dom";
import { ClipboardList, Handshake, Plus, Users } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCommercialLeads, useAdminCommercialOffers } from "@/features/comercial";

const AdminComercial = () => {
  const { data: leads = [] } = useAdminCommercialLeads("novo");
  const { data: offers = [] } = useAdminCommercialOffers();

  const activeOffersCount = offers.filter((offer) => offer.status === "active").length;
  const offersStat =
    offers.length === 0
      ? "Nenhuma oferta"
      : `${activeOffersCount} ativas · ${offers.length} no total`;

  const modules = [
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
      stat: offersStat,
      title: "Ofertas privadas",
    },
  ];

  return (
    <AdminPageShell
      description="Gerencie leads e propostas comerciais da plataforma FestaAI."
      title="Comercial"
    >
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/admin/comercial/ofertas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Oferta
          </Link>
        </Button>
      </div>

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
