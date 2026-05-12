import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, History } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AppLayout from "@/components/AppLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENT_IMPACT_AREA_VALUES,
  AGENT_REQUEST_TYPE_VALUES,
  AGENT_URGENCY_VALUES,
  agentBillingStatusLabels,
  agentChangeRequestInsertSchema,
  agentImpactAreaLabels,
  agentRequestTypeLabels,
  agentStatusLabels,
  agentUrgencyLabels,
  LEGAL_NOTICE,
  type AgentChangeRequestInsertValues,
  type AgentChangeRequestRow,
  useCreateAgentChangeRequest,
  useTenantAgentChangeRequests,
} from "@/features/agent-change-requests";
import { toast } from "@/hooks/use-toast";

const suporteSolicitacaoSchema = z.object({
  title: z.string().trim().min(3, "Informe um título (mínimo 3 caracteres)").max(200),
  description: z.string().trim().min(10, "Descreva com pelo menos 10 caracteres").max(8000),
});

type SuporteSolicitacaoValues = z.infer<typeof suporteSolicitacaoSchema>;

const FINALIZED_STATUSES = new Set(["completed", "rejected"]);

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

interface SuportePedidosListaProps {
  rows: AgentChangeRequestRow[];
}

const SuportePedidosLista = ({ rows }: SuportePedidosListaProps) => {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma solicitação nesta lista.
      </p>
    );
  }

  return (
    <div className="divide-y rounded-xl border">
      {rows.map((row) => (
        <Link
          className="block px-4 py-4 transition-colors hover:bg-muted/40"
          key={row.id}
          to={`/suporte/${row.id}`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-foreground">{row.title}</p>
              <p className="text-xs text-muted-foreground">
                {dateFormatter.format(new Date(row.created_at))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {agentStatusLabels[row.status as keyof typeof agentStatusLabels] ?? row.status}
              </Badge>
              <Badge variant="outline">
                {agentUrgencyLabels[row.urgency as keyof typeof agentUrgencyLabels] ?? row.urgency}
              </Badge>
              {row.billing_status !== "not_defined" && (
                <Badge variant="outline" className="border-primary/30">
                  {agentBillingStatusLabels[row.billing_status as keyof typeof agentBillingStatusLabels] ??
                    row.billing_status}
                </Badge>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

interface NovaSolicitacaoSimpleFormProps {
  createRequest: ReturnType<typeof useCreateAgentChangeRequest>;
  descriptionPlaceholder: string;
  formCardDescription: string;
  navigate: ReturnType<typeof useNavigate>;
  titlePlaceholder: string;
}

const NovaSolicitacaoSimpleForm = ({
  createRequest,
  descriptionPlaceholder,
  formCardDescription,
  navigate,
  titlePlaceholder,
}: NovaSolicitacaoSimpleFormProps) => {
  const form = useForm<SuporteSolicitacaoValues>({
    defaultValues: {
      description: "",
      title: "",
    },
    resolver: zodResolver(suporteSolicitacaoSchema),
  });

  const onSubmit = async (values: SuporteSolicitacaoValues) => {
    try {
      const id = await createRequest.mutateAsync({
        description: values.description,
        desired_example: null,
        impact_area: null,
        request_type: "other",
        title: values.title,
        urgency: "normal",
      });

      toast({
        title: "Solicitação enviada",
        description: "Sua equipe FestaAI irá analisar o pedido.",
      });

      navigate(`/suporte/${id}`, { replace: true });
    } catch (submitError) {
      toast({
        title: "Não foi possível enviar",
        description: submitError instanceof Error ? submitError.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-card max-w-3xl border-white/40">
      <CardHeader>
        <CardTitle>Formulário</CardTitle>
        <CardDescription>{formCardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder={titlePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-32"
                      placeholder={descriptionPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full sm:w-auto" disabled={createRequest.isPending} type="submit">
              {createRequest.isPending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

interface NovaSolicitacaoAgenteFormProps {
  createRequest: ReturnType<typeof useCreateAgentChangeRequest>;
  descriptionPlaceholder: string;
  formCardDescription: string;
  navigate: ReturnType<typeof useNavigate>;
  titlePlaceholder: string;
}

const NovaSolicitacaoAgenteForm = ({
  createRequest,
  descriptionPlaceholder,
  formCardDescription,
  navigate,
  titlePlaceholder,
}: NovaSolicitacaoAgenteFormProps) => {
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const form = useForm<AgentChangeRequestInsertValues>({
    defaultValues: {
      description: "",
      desired_example: "",
      title: "",
      urgency: "normal",
    },
    resolver: zodResolver(agentChangeRequestInsertSchema),
  });

  const onSubmit = async (values: AgentChangeRequestInsertValues) => {
    if (!acceptedLegal) {
      toast({
        title: "Confirmação necessária",
        description: "Marque que você leu o aviso sobre implantação e possíveis cobranças.",
        variant: "destructive",
      });
      return;
    }

    try {
      const id = await createRequest.mutateAsync({
        description: values.description,
        desired_example: values.desired_example?.trim() ? values.desired_example.trim() : null,
        impact_area: values.impact_area ?? null,
        request_type: values.request_type,
        title: values.title,
        urgency: values.urgency,
      });

      toast({
        title: "Solicitação enviada",
        description: "Sua equipe FestaAI irá analisar o pedido.",
      });

      navigate(`/suporte/${id}`, { replace: true });
    } catch (submitError) {
      toast({
        title: "Não foi possível enviar",
        description: submitError instanceof Error ? submitError.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-card max-w-3xl border-white/40">
      <CardHeader>
        <CardTitle>Formulário</CardTitle>
        <CardDescription>{formCardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder={titlePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="request_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de solicitação *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AGENT_REQUEST_TYPE_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {agentRequestTypeLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="impact_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área impactada</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "__none__" ? undefined : v)}
                    value={field.value ?? "__none__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Não informar</SelectItem>
                      {AGENT_IMPACT_AREA_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {agentImpactAreaLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-32" placeholder={descriptionPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desired_example"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exemplo de resposta desejada</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-24"
                      placeholder="Opcional: como o agente deveria responder ou se comportar"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgência *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AGENT_URGENCY_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {agentUrgencyLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertTitle className="text-sm text-foreground">Antes de enviar</AlertTitle>
              <AlertDescription className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {LEGAL_NOTICE}
              </AlertDescription>
            </Alert>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/40 bg-background/50 p-4 text-sm">
              <Checkbox
                checked={acceptedLegal}
                className="mt-0.5"
                onCheckedChange={(v) => setAcceptedLegal(v === true)}
              />
              <span className="text-muted-foreground">
                Li e entendi o aviso sobre implantação, ajustes inclusos e possível cobrança adicional.
              </span>
            </label>

            <Button className="w-full sm:w-auto" disabled={createRequest.isPending} type="submit">
              {createRequest.isPending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export interface SuporteRequestWorkspaceProps {
  backHref: string;
  backLabel: string;
  defaultTab?: "nova" | "historico";
  descriptionPlaceholder: string;
  formCardDescription: string;
  heading: string;
  intro: string;
  novaSolicitacaoForm?: "simple" | "detailed";
  titlePlaceholder: string;
}

export const SuporteRequestWorkspace = ({
  backHref,
  backLabel,
  defaultTab = "nova",
  descriptionPlaceholder,
  formCardDescription,
  heading,
  intro,
  novaSolicitacaoForm = "simple",
  titlePlaceholder,
}: SuporteRequestWorkspaceProps) => {
  const navigate = useNavigate();
  const createRequest = useCreateAgentChangeRequest();
  const { data: rows = [], error, isLoading } = useTenantAgentChangeRequests();

  const { emAberto, finalizadas } = useMemo(() => {
    const emAbertoList: AgentChangeRequestRow[] = [];
    const finalizadasList: AgentChangeRequestRow[] = [];
    for (const row of rows) {
      if (FINALIZED_STATUSES.has(row.status)) {
        finalizadasList.push(row);
      } else {
        emAbertoList.push(row);
      }
    }
    return { emAberto: emAbertoList, finalizadas: finalizadasList };
  }, [rows]);

  return (
    <AppLayout>
      <div className="mb-6">
        <Button asChild className="mb-4 gap-2" variant="ghost" size="sm">
          <Link to={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{intro}</p>
      </div>

      <Tabs className="w-full" defaultValue={defaultTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="nova">Nova solicitação</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0" value="nova">
          {novaSolicitacaoForm === "detailed" ? (
            <NovaSolicitacaoAgenteForm
              createRequest={createRequest}
              descriptionPlaceholder={descriptionPlaceholder}
              formCardDescription={formCardDescription}
              navigate={navigate}
              titlePlaceholder={titlePlaceholder}
            />
          ) : (
            <NovaSolicitacaoSimpleForm
              createRequest={createRequest}
              descriptionPlaceholder={descriptionPlaceholder}
              formCardDescription={formCardDescription}
              navigate={navigate}
              titlePlaceholder={titlePlaceholder}
            />
          )}
        </TabsContent>

        <TabsContent className="mt-0 space-y-6" value="historico">
          {error && (
            <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível carregar as solicitações.
            </div>
          )}

          <Card className="glass-card border-white/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Em aberto
              </CardTitle>
              <CardDescription>Pedidos em análise, orçamento ou implementação.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <SuportePedidosLista rows={emAberto} />
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-white/40">
            <CardHeader>
              <CardTitle className="text-lg">Finalizadas</CardTitle>
              <CardDescription>Solicitações concluídas ou encerradas.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <SuportePedidosLista rows={finalizadas} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};
