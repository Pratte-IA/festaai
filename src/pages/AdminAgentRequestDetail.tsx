import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENT_BILLING_STATUS_VALUES,
  AGENT_STATUS_VALUES,
  agentBillingStatusLabels,
  agentImpactAreaLabels,
  agentRequestTypeLabels,
  agentStatusLabels,
  agentUrgencyLabels,
  useAdminAgentChangeRequest,
  useAdminUpdateAgentChangeRequest,
  useAdminUpsertInternalNotes,
} from "@/features/agent-change-requests";
import { toast } from "@/hooks/use-toast";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const AdminAgentRequestDetail = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = useMemo(() => (rawId ? Number(rawId) : NaN), [rawId]);
  const { data, error, isLoading } = useAdminAgentChangeRequest(Number.isFinite(id) ? id : null);
  const updateMain = useAdminUpdateAgentChangeRequest();
  const upsertNotes = useAdminUpsertInternalNotes();

  const [status, setStatus] = useState("");
  const [billingStatus, setBillingStatus] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!data) {
      return;
    }
    setStatus(data.status);
    setBillingStatus(data.billing_status);
    setPriceInput(data.estimated_price != null ? String(data.estimated_price) : "");

    const rawInternal = data.agent_change_request_internal;
    const internalRow = Array.isArray(rawInternal) ? rawInternal[0] : rawInternal;
    setAdminNotes(internalRow?.admin_notes ?? "");
  }, [data]);

  const tenantLabel = data?.tenants?.name ?? (data ? `Tenant #${data.tenant_id}` : "");

  const handleSave = async () => {
    if (!data || !Number.isFinite(id)) {
      return;
    }

    let estimated: number | null = null;
    if (priceInput.trim() !== "") {
      const n = Number(priceInput.replace(",", "."));
      if (Number.isNaN(n)) {
        toast({
          title: "Valor inválido",
          description: "Informe o valor estimado como número ou deixe em branco.",
          variant: "destructive",
        });
        return;
      }
      estimated = n;
    }

    try {
      await updateMain.mutateAsync({
        id: data.id,
        patch: {
          billing_status: billingStatus,
          estimated_price: estimated,
          status,
        },
      });

      await upsertNotes.mutateAsync({
        adminNotes: adminNotes.trim() === "" ? null : adminNotes.trim(),
        requestId: data.id,
      });

      toast({
        title: "Salvo",
        description: "Solicitação e notas internas atualizadas.",
      });
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!Number.isFinite(id)) {
    return (
      <main className="px-4 py-8">
        <p className="text-sm text-destructive">ID inválido.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/admin/agent-requests">Voltar</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Button asChild className="w-fit gap-1" size="sm" variant="ghost">
            <Link to="/admin/agent-requests">
              <ArrowLeft className="h-4 w-4" />
              Lista
            </Link>
          </Button>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {error && <p className="text-sm text-destructive">Não foi possível carregar.</p>}
          {data && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{data.title}</h1>
                <Badge variant="outline">{tenantLabel}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                #{data.id} · Criada em {dateFormatter.format(new Date(data.created_at))}
                {data.tenants?.slug && (
                  <>
                    {" "}
                    · <span className="font-mono">{data.tenants.slug}</span>
                  </>
                )}
              </p>
              <Button asChild className="w-fit" size="sm" variant="link">
                <Link className="px-0" to={`/admin/tenants/${data.tenant_id}`}>
                  Ver cliente no admin
                </Link>
              </Button>
            </>
          )}
        </div>

        {data && (
          <>
            <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Pedido do cliente</CardTitle>
                <CardDescription>Somente leitura — origem do formulário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Tipo</p>
                    <p>
                      {agentRequestTypeLabels[data.request_type as keyof typeof agentRequestTypeLabels] ??
                        data.request_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Área</p>
                    <p>
                      {data.impact_area
                        ? agentImpactAreaLabels[data.impact_area as keyof typeof agentImpactAreaLabels] ?? data.impact_area
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Urgência</p>
                    <p>{agentUrgencyLabels[data.urgency as keyof typeof agentUrgencyLabels] ?? data.urgency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Descrição</p>
                  <p className="mt-1 whitespace-pre-wrap">{data.description}</p>
                </div>
                {data.desired_example && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Exemplo desejado</p>
                    <p className="mt-1 whitespace-pre-wrap">{data.desired_example}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Operação</CardTitle>
                <CardDescription>Status comercial, cobrança e notas internas (não visíveis ao cliente).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adm-status">Status</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      id="adm-status"
                      onChange={(e) => setStatus(e.target.value)}
                      value={status}
                    >
                      {AGENT_STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {agentStatusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adm-billing">Cobrança</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      id="adm-billing"
                      onChange={(e) => setBillingStatus(e.target.value)}
                      value={billingStatus}
                    >
                      {AGENT_BILLING_STATUS_VALUES.map((b) => (
                        <option key={b} value={b}>
                          {agentBillingStatusLabels[b]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-price">Valor estimado (R$)</Label>
                  <Input
                    id="adm-price"
                    inputMode="decimal"
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="Vazio = sem valor"
                    value={priceInput}
                  />
                  <p className="text-xs text-muted-foreground">Para cobrança à parte; pagamento pelo cliente virá em outra etapa.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-notes">Notas internas</Label>
                  <Textarea
                    className="min-h-28 font-mono text-sm"
                    id="adm-notes"
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Histórico de análise, combinados com o cliente, etc."
                    value={adminNotes}
                  />
                </div>
                <Button
                  className="gap-2"
                  disabled={updateMain.isPending || upsertNotes.isPending}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  <Save className="h-4 w-4" />
                  Salvar alterações
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
};

export default AdminAgentRequestDetail;
