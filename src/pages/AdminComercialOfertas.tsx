import { Link } from "react-router-dom";
import { Copy, Plus } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildOfferPublicUrl,
  commercialOfferStatusLabels,
  useAdminCommercialOffers,
  useAdminUpdateCommercialOfferStatus,
  type CommercialOfferStatus,
} from "@/features/comercial";
import { formatContratarBRL } from "@/pages/contratar-commercial-data";
import { toast } from "@/hooks/use-toast";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const AdminComercialOfertas = () => {
  const { data: offers = [], error, isLoading } = useAdminCommercialOffers();
  const updateStatus = useAdminUpdateCommercialOfferStatus();

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(buildOfferPublicUrl(token));
      toast({ title: "Link copiado" });
    } catch {
      toast({ title: "Não foi possível copiar o link", variant: "destructive" });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await updateStatus.mutateAsync({ id, status: "cancelled" });
      toast({ title: "Oferta cancelada" });
    } catch {
      toast({ title: "Erro ao cancelar oferta", variant: "destructive" });
    }
  };

  return (
    <AdminPageShell
      backHref="/admin/comercial"
      backLabel="Voltar ao Comercial"
      description="Propostas comerciais com link privado para formalização."
      title="Ofertas privadas"
    >
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/admin/comercial/ofertas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova oferta
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardHeader>
          <CardTitle>Ofertas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando ofertas...</p>}
          {error && <p className="text-sm text-destructive">Não foi possível carregar as ofertas.</p>}
          {!isLoading && !error && offers.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma oferta criada ainda.
            </p>
          )}

          {offers.length > 0 && (
            <div className="divide-y rounded-xl border">
              {offers.map((offer) => (
                <article className="grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr_auto]" key={offer.id}>
                  <div>
                    <p className="font-semibold">{offer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {offer.recipient_company ?? "Sem empresa definida"}
                    </p>
                    <p className="mt-1 text-sm">
                      {formatContratarBRL(Number(offer.monthly_price))}/mês · Setup{" "}
                      {formatContratarBRL(Number(offer.setup_price))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira em {dateFormatter.format(new Date(offer.expires_at))}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Badge>{commercialOfferStatusLabels[offer.status as CommercialOfferStatus] ?? offer.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {offer.status === "active" && (
                      <Button onClick={() => void copyLink(offer.token)} size="sm" variant="outline">
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar link
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/comercial/ofertas/${offer.id}`}>Editar</Link>
                    </Button>
                    {offer.status === "active" && (
                      <Button onClick={() => void handleCancel(offer.id)} size="sm" variant="ghost">
                        Cancelar
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
};

export default AdminComercialOfertas;
