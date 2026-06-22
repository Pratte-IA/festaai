import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminBillingContracts } from "@/features/comercial";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const statusVariant = (status: string) => {
  if (status === "active" || status === "trialing") return "default";
  if (status === "pending") return "secondary";
  return "destructive";
};

const AdminComercialContratos = () => {
  const { data: contracts = [], error, isLoading } = useAdminBillingContracts();

  return (
    <AdminPageShell
      backHref="/admin/comercial"
      backLabel="Voltar ao Comercial"
      description="Assinaturas FestaAI registradas via checkout."
      title="Contratos"
    >
      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando contratos...</p>}
          {error && <p className="text-sm text-destructive">Não foi possível carregar os contratos.</p>}
          {!isLoading && !error && contracts.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum contrato registrado ainda.
            </p>
          )}

          {contracts.length > 0 && (
            <div className="divide-y rounded-xl border">
              {contracts.map((contract) => (
                <article className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]" key={contract.id}>
                  <div>
                    <p className="font-semibold">{contract.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{contract.company_name ?? contract.customer_email}</p>
                    <p className="text-xs text-muted-foreground">
                      Plano: {contract.plan_name ?? "—"}
                      {contract.metadata.commercial_offer_token
                        ? ` · Oferta ${String(contract.metadata.commercial_offer_token)}`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <Badge variant={statusVariant(contract.status)}>{contract.status}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(contract.created_at))}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {contract.tenant_name ? `Tenant: ${contract.tenant_name}` : "Sem tenant vinculado"}
                  </div>
                  <div>
                    {contract.checkout_url ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={contract.checkout_url} rel="noopener noreferrer" target="_blank">
                          Checkout
                        </a>
                      </Button>
                    ) : null}
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

export default AdminComercialContratos;
