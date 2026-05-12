import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  agentBillingStatusLabels,
  agentImpactAreaLabels,
  agentRequestTypeLabels,
  agentStatusLabels,
  agentUrgencyLabels,
  useDeleteAgentChangeRequest,
  useTenantAgentChangeRequest,
} from "@/features/agent-change-requests";
import { toast } from "@/hooks/use-toast";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const SuporteDetalhe = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const id = useMemo(() => (idParam ? Number(idParam) : NaN), [idParam]);
  const navigate = useNavigate();
  const { data: row, error, isLoading } = useTenantAgentChangeRequest(Number.isFinite(id) ? id : null);
  const deleteRequest = useDeleteAgentChangeRequest();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canDelete =
    row && row.status !== "in_progress" && row.status !== "completed";

  const handleDelete = async () => {
    if (!row) {
      return;
    }

    try {
      await deleteRequest.mutateAsync(row.id);
      toast({ title: "Solicitação excluída", description: "Você pode criar um novo pedido se precisar." });
      navigate("/suporte/agente", { replace: true });
    } catch (e) {
      toast({
        title: "Não foi possível excluir",
        description: e instanceof Error ? e.message : "Verifique se o status ainda permite exclusão.",
        variant: "destructive",
      });
    }
  };

  if (!Number.isFinite(id)) {
    return (
      <AppLayout>
        <p className="text-sm text-destructive">Identificador inválido.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/suporte">Voltar</Link>
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <Button asChild className="mb-4 gap-2" variant="ghost" size="sm">
          <Link to="/suporte/agente">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        {row && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">{row.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Criada em {dateFormatter.format(new Date(row.created_at))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {agentStatusLabels[row.status as keyof typeof agentStatusLabels] ?? row.status}
              </Badge>
              <Badge variant="outline">
                {agentUrgencyLabels[row.urgency as keyof typeof agentUrgencyLabels] ?? row.urgency}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {error && (
        <p className="text-sm text-destructive">Não foi possível carregar esta solicitação.</p>
      )}

      {!isLoading && !row && !error && (
        <p className="text-sm text-muted-foreground">Solicitação não encontrada.</p>
      )}

      {row && (
        <>
          <Card className="glass-card mb-6 border-white/40">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Detalhes do pedido</CardTitle>
                <CardDescription>Leitura apenas — alterações são feitas pela equipe FestaAI.</CardDescription>
              </div>
              {canDelete && (
                <Button
                  className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={deleteRequest.isPending}
                  onClick={() => setDeleteOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir solicitação
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</p>
                  <p className="mt-1 text-foreground">
                    {agentRequestTypeLabels[row.request_type as keyof typeof agentRequestTypeLabels] ??
                      row.request_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Área impactada
                  </p>
                  <p className="mt-1 text-foreground">
                    {row.impact_area
                      ? agentImpactAreaLabels[row.impact_area as keyof typeof agentImpactAreaLabels] ??
                        row.impact_area
                      : "—"}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</p>
                <p className="mt-2 whitespace-pre-wrap text-foreground">{row.description}</p>
              </div>
              {row.desired_example && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Exemplo desejado
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-foreground">{row.desired_example}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/40">
            <CardHeader>
              <CardTitle className="text-lg">Status e cobrança</CardTitle>
              <CardDescription>
                Acompanhe a análise. Quando houver cobrança à parte, o valor estimado aparece aqui — o pagamento
                online será acoplado em uma próxima etapa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground">Cobrança:</span>
                <Badge variant="outline">
                  {agentBillingStatusLabels[row.billing_status as keyof typeof agentBillingStatusLabels] ??
                    row.billing_status}
                </Badge>
              </div>
              {row.estimated_price != null && (
                <p className="text-foreground">
                  Valor estimado:{" "}
                  <span className="font-semibold tabular-nums">
                    {currencyFormatter.format(Number(row.estimated_price))}
                  </span>
                </p>
              )}
              {(row.status === "quoted" || row.billing_status === "billable") && (
                <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                  Quando o orçamento for aprovado, você poderá confirmar e quitar por aqui; em seguida nossa equipe
                  seguirá com a implementação no agente.
                </p>
              )}
              {!canDelete && (
                <p className="text-xs text-muted-foreground">
                  Pedidos em implementação ou já concluídos não podem ser excluídos (histórico preservado).
                </p>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove o registro. Quando a equipe já estiver implementando ou tiver concluído, a
                  exclusão não é permitida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void handleDelete()}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AppLayout>
  );
};

export default SuporteDetalhe;
