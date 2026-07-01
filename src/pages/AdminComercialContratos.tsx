import { Link } from "react-router-dom";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminBillingContracts,
} from "@/features/comercial/use-admin-billing-contracts";
import { useAdminContractAcceptances } from "@/features/comercial/use-admin-contract-acceptances";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const statusVariant = (status: string) => {
  if (status === "active" || status === "trialing") return "default";
  if (status === "pending") return "secondary";
  return "destructive";
};

const AdminComercialContratos = () => {
  const {
    data: acceptances = [],
    error: acceptancesError,
    isLoading: isAcceptancesLoading,
  } = useAdminContractAcceptances();
  const { data: subscriptions = [], error: subscriptionsError, isLoading: isSubscriptionsLoading } =
    useAdminBillingContracts();

  return (
    <AdminPageShell
      backHref="/admin/comercial"
      backLabel="Voltar ao Comercial"
      description="Aceites contratuais com IP e assinaturas de billing."
      title="Contratos"
    >
      <Tabs defaultValue="aceites">
        <TabsList>
          <TabsTrigger value="aceites">Aceites contratuais</TabsTrigger>
          <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="aceites">
          <Card className="mt-4 rounded-2xl border-white/80 bg-white/90">
            <CardHeader>
              <CardTitle>Aceites eletrônicos</CardTitle>
            </CardHeader>
            <CardContent>
              {isAcceptancesLoading && (
                <p className="text-sm text-muted-foreground">Carregando aceites...</p>
              )}
              {acceptancesError && (
                <p className="text-sm text-destructive">Não foi possível carregar os aceites.</p>
              )}
              {!isAcceptancesLoading && !acceptancesError && acceptances.length === 0 && (
                <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum aceite contratual registrado ainda.
                </p>
              )}

              {acceptances.length > 0 && (
                <div className="divide-y rounded-xl border">
                  {acceptances.map((item) => (
                    <article
                      className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
                      key={item.id}
                    >
                      <div>
                        <p className="font-semibold">{item.accepted_by_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.accepted_by_company ?? item.accepted_by_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          v{item.contract_version}
                          {item.external_reference ? ` · ${item.external_reference}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aceite</p>
                        <p className="text-sm">{dateFormatter.format(new Date(item.accepted_at))}</p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          IP: {item.ip_address ?? "—"}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.tenant_name ? `Tenant: ${item.tenant_name}` : "Sem tenant vinculado"}
                        {item.subscription_status ? (
                          <Badge className="ml-2" variant={statusVariant(item.subscription_status)}>
                            {item.subscription_status}
                          </Badge>
                        ) : null}
                      </div>
                      <div>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/comercial/contratos/aceite/${item.id}`}>Ver contrato</Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assinaturas">
          <Card className="mt-4 rounded-2xl border-white/80 bg-white/90">
            <CardHeader>
              <CardTitle>Assinaturas (billing)</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubscriptionsLoading && (
                <p className="text-sm text-muted-foreground">Carregando assinaturas...</p>
              )}
              {subscriptionsError && (
                <p className="text-sm text-destructive">Não foi possível carregar as assinaturas.</p>
              )}
              {!isSubscriptionsLoading && !subscriptionsError && subscriptions.length === 0 && (
                <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhuma assinatura registrada ainda.
                </p>
              )}

              {subscriptions.length > 0 && (
                <div className="divide-y rounded-xl border">
                  {subscriptions.map((contract) => (
                    <article
                      className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
                      key={contract.id}
                    >
                      <div>
                        <p className="font-semibold">{contract.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.company_name ?? contract.customer_email}
                        </p>
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
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
};

export default AdminComercialContratos;
