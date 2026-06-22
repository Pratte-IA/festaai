import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COMMERCIAL_LEAD_STATUS_VALUES,
  commercialLeadStatusLabels,
  useAdminCommercialLeads,
  useAdminUpdateCommercialLeadStatus,
  type CommercialLeadStatus,
} from "@/features/comercial";
import { toast } from "@/hooks/use-toast";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const AdminComercialLeads = () => {
  const { data: leads = [], error, isLoading } = useAdminCommercialLeads();
  const updateStatus = useAdminUpdateCommercialLeadStatus();

  const handleStatusChange = async (id: number, status: CommercialLeadStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Status atualizado" });
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  return (
    <AdminPageShell
      backHref="/admin/comercial"
      backLabel="Voltar ao Comercial"
      description="Leads capturados pelo formulário Plano sob medida."
      title="Leads comerciais"
    >
      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Solicitações</CardTitle>
          <Button asChild size="sm">
            <Link to="/admin/comercial/ofertas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova oferta
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando leads...</p>}
          {error && <p className="text-sm text-destructive">Não foi possível carregar os leads.</p>}
          {!isLoading && !error && leads.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum lead registrado ainda.
            </p>
          )}

          {leads.length > 0 && (
            <div className="divide-y rounded-xl border">
              {leads.map((lead) => (
                <article className="grid gap-4 p-4 md:grid-cols-[1.2fr_1fr_auto]" key={lead.id}>
                  <div>
                    <p className="font-semibold">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.email} · {lead.phone}
                    </p>
                    {lead.message ? (
                      <p className="mt-2 text-sm text-muted-foreground">{lead.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(lead.created_at))}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Badge variant={lead.status === "novo" ? "default" : "secondary"}>
                      {commercialLeadStatusLabels[lead.status as CommercialLeadStatus] ?? lead.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                    <select
                      aria-label="Alterar status do lead"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      onChange={(e) =>
                        void handleStatusChange(lead.id, e.target.value as CommercialLeadStatus)
                      }
                      value={lead.status}
                    >
                      {COMMERCIAL_LEAD_STATUS_VALUES.map((status) => (
                        <option key={status} value={status}>
                          {commercialLeadStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to={`/admin/comercial/ofertas/nova?leadId=${lead.id}&company=${encodeURIComponent(lead.company_name)}&email=${encodeURIComponent(lead.email)}`}
                      >
                        Criar oferta
                      </Link>
                    </Button>
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

export default AdminComercialLeads;
