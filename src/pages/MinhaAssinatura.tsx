import { ExternalLink } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBillingSubscription } from "@/features/billing";

const statusLabel: Record<string, string> = {
  active: "Ativa",
  canceled: "Cancelada",
  failed: "Falhou",
  past_due: "Em atraso",
  pending: "Pendente",
  trialing: "Trial",
};

const statusVariant = (status: string) => {
  if (status === "active" || status === "trialing") return "default";
  if (status === "past_due" || status === "failed") return "destructive";
  return "secondary";
};

const formatBRL = (value?: number | null) =>
  (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (value?: string | null) => {
  if (!value) return "Nao informado";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
};

const MinhaAssinatura = () => {
  const { data: subscription, error, isLoading } = useBillingSubscription();
  const plan = subscription?.subscription_plans;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Minha Assinatura</h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe o plano contratado e o status de pagamento para sua casa de festa.
          </p>
        </div>

        <Card className="border-border/60 bg-card/95">
          <CardHeader>
            <CardTitle>Status da assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Carregando assinatura...</p>}

            {error && (
              <p className="text-sm text-destructive">
                Nao foi possivel carregar a assinatura. Tente novamente em instantes.
              </p>
            )}

            {!isLoading && !error && !subscription && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="font-medium">Nenhuma assinatura vinculada a sua casa de festa.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quando uma contratação for concluida, o status aparecerá aqui.
                </p>
                <Button asChild className="mt-4">
                  <a href="/contratar">Ver planos</a>
                </Button>
              </div>
            )}

            {subscription && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="mt-1 text-lg font-semibold">{plan?.name ?? "Plano nao identificado"}</p>
                  <p className="text-sm text-muted-foreground">{formatBRL(plan?.monthly_price)}/mes</p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="mt-2" variant={statusVariant(subscription.status)}>
                    {statusLabel[subscription.status] ?? subscription.status}
                  </Badge>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Proximo vencimento</p>
                  <p className="mt-1 font-medium">{formatDate(subscription.next_due_date)}</p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Provedor</p>
                  <p className="mt-1 font-medium uppercase">{subscription.provider}</p>
                </div>

                {subscription.checkout_url && (
                  <div className="md:col-span-2">
                    <Button asChild variant="outline">
                      <a href={subscription.checkout_url} target="_blank" rel="noreferrer">
                        Abrir boleto e pagar <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MinhaAssinatura;
