import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  ListTodo,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { TarefaFormDialog } from "@/components/tarefas/TarefaFormDialog";
import { useAuth } from "@/features/auth";
import {
  useCreateEventoTarefa,
  useDeleteEventoTarefa,
  useEventos,
  useToggleEventoTarefa,
  useUpdateEventoTarefa,
} from "@/features/eventos";
import { isInactiveEvento } from "@/features/eventos/is-closed-party-event";
import { filterTenantTarefas, isTarefaOverdue } from "@/features/tarefas/filter-tenant-tarefas";
import { getTarefaResponsavelUserId } from "@/features/tarefas/resolve-tarefa-responsavel";
import { useTenantTarefas } from "@/features/tarefas/use-tenant-tarefas";
import type { TenantTarefaListItem, TarefaStatusFilter } from "@/features/tarefas/types";
import { useTenantTeamMembers } from "@/features/usuarios";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatIsoDateBR } from "@/lib/date";
import { toast } from "@/hooks/use-toast";

const statusTabs: { key: TarefaStatusFilter; label: string }[] = [
  { key: "pendentes", label: "Pendentes" },
  { key: "concluidas", label: "Concluídas" },
  { key: "todas", label: "Todas" },
];

const getEventoLabel = (tarefa: TenantTarefaListItem) => {
  const evento = tarefa.evento;
  if (!evento) return "Evento removido";

  const parts = [evento.cliente_nome];
  if (evento.aniversariante_nome) {
    parts.push(`(${evento.aniversariante_nome})`);
  }
  return parts.join(" ");
};

const Tarefas = () => {
  const { user } = useAuth();
  const { data: tarefas = [], error, isLoading } = useTenantTarefas();
  const { data: eventos = [] } = useEventos();
  const { data: teamMembers = [] } = useTenantTeamMembers();
  const createTarefa = useCreateEventoTarefa();
  const toggleTarefa = useToggleEventoTarefa();
  const updateTarefa = useUpdateEventoTarefa();
  const deleteTarefa = useDeleteEventoTarefa();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TarefaStatusFilter>("pendentes");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<TenantTarefaListItem | null>(null);
  const [deletingTarefa, setDeletingTarefa] = useState<TenantTarefaListItem | null>(null);

  const activeEventos = useMemo(
    () => eventos.filter((evento) => !isInactiveEvento(evento)),
    [eventos],
  );

  const filteredTarefas = useMemo(
    () => filterTenantTarefas(tarefas, { search, status: statusFilter }),
    [search, statusFilter, tarefas],
  );

  const stats = useMemo(() => {
    const pendentes = tarefas.filter((tarefa) => !tarefa.concluida);
    const concluidas = tarefas.filter((tarefa) => tarefa.concluida);
    const vencidas = pendentes.filter(isTarefaOverdue);

    return {
      concluidas: concluidas.length,
      pendentes: pendentes.length,
      vencidas: vencidas.length,
    };
  }, [tarefas]);

  const handleToggle = async (tarefa: TenantTarefaListItem, concluida: boolean) => {
    try {
      await toggleTarefa.mutateAsync({
        concluida,
        eventoId: tarefa.evento_id,
        tarefaId: tarefa.id,
      });
    } catch {
      toast({
        title: "Nao foi possivel atualizar a tarefa",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async (values: {
    assignedTo: string;
    dataLimite: string | null;
    eventoId: number;
    titulo: string;
  }) => {
    try {
      await createTarefa.mutateAsync({
        assignedTo: values.assignedTo,
        dataLimite: values.dataLimite,
        eventoId: values.eventoId,
        titulo: values.titulo,
      });
      toast({
        title: "Tarefa criada",
        description: "A tarefa foi adicionada com sucesso.",
      });
      setIsCreateOpen(false);
    } catch {
      toast({
        title: "Nao foi possivel criar a tarefa",
        description: "Revise os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (values: {
    assignedTo: string;
    dataLimite: string | null;
    titulo: string;
  }) => {
    if (!editingTarefa) return;

    try {
      await updateTarefa.mutateAsync({
        assignedTo: values.assignedTo,
        dataLimite: values.dataLimite,
        eventoId: editingTarefa.evento_id,
        tarefaId: editingTarefa.id,
        titulo: values.titulo,
      });
      toast({
        title: "Tarefa atualizada",
        description: "As alteracoes foram salvas.",
      });
      setEditingTarefa(null);
    } catch {
      toast({
        title: "Nao foi possivel salvar a tarefa",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTarefa) return;

    try {
      await deleteTarefa.mutateAsync({
        eventoId: deletingTarefa.evento_id,
        tarefaId: deletingTarefa.id,
      });
      toast({
        title: "Tarefa removida",
        description: "A tarefa foi excluida permanentemente.",
      });
      setDeletingTarefa(null);
    } catch {
      toast({
        title: "Nao foi possivel excluir a tarefa",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as tarefas dos eventos em um unico lugar.
          </p>
        </div>
        <Button className="gap-2" type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova tarefa
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Circle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.concluidas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.vencidas}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                statusFilter === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar tarefa, cliente ou responsavel..."
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ListTodo className="h-4 w-4 text-festa-blue" />
            Lista de tarefas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm italic text-muted-foreground">Carregando tarefas...</p>
          )}

          {error && (
            <p className="text-sm text-destructive">
              Nao foi possivel carregar as tarefas. Tente recarregar a pagina.
            </p>
          )}

          {!isLoading && !error && filteredTarefas.length === 0 && (
            <p className="text-sm italic text-muted-foreground">
              {tarefas.length === 0
                ? "Nenhuma tarefa registrada. Crie a primeira tarefa para comecar."
                : "Nenhuma tarefa encontrada com os filtros atuais."}
            </p>
          )}

          <div className="space-y-2">
            {filteredTarefas.map((tarefa) => {
              const overdue = isTarefaOverdue(tarefa);

              return (
                <div
                  key={tarefa.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Checkbox
                      checked={tarefa.concluida}
                      onCheckedChange={(checked) => void handleToggle(tarefa, checked === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          tarefa.concluida ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {tarefa.titulo}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="h-3 w-3" />
                          {tarefa.responsavelNome}
                        </span>
                        <span aria-hidden>•</span>
                        <span>{getEventoLabel(tarefa)}</span>
                        {tarefa.evento?.data_evento && (
                          <>
                            <span aria-hidden>•</span>
                            <span>Festa: {formatIsoDateBR(tarefa.evento.data_evento)}</span>
                          </>
                        )}
                        {tarefa.data_limite && (
                          <>
                            <span aria-hidden>•</span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              Prazo: {formatIsoDateBR(tarefa.data_limite)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {overdue && (
                      <Badge variant="outline" className="border-coral/40 bg-coral/10 text-coral">
                        Vencida
                      </Badge>
                    )}
                    {tarefa.evento && (
                      <Button variant="ghost" size="sm" className="gap-1" asChild>
                        <Link to={`/crm/evento/${tarefa.evento.id}`}>
                          Evento
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Acoes da tarefa</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTarefa(tarefa)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingTarefa(tarefa)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TarefaFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        eventos={activeEventos}
        teamMembers={teamMembers}
        defaultAssignedTo={user?.id ?? null}
        isSubmitting={createTarefa.isPending}
        onSubmit={handleCreate}
      />

      <TarefaFormDialog
        open={Boolean(editingTarefa)}
        onOpenChange={(open) => {
          if (!open) setEditingTarefa(null);
        }}
        mode="edit"
        eventos={activeEventos}
        teamMembers={teamMembers}
        initialValues={
          editingTarefa
            ? {
                assignedTo: getTarefaResponsavelUserId(editingTarefa) ?? "",
                dataLimite: editingTarefa.data_limite,
                eventoId: editingTarefa.evento_id,
                titulo: editingTarefa.titulo,
              }
            : undefined
        }
        isSubmitting={updateTarefa.isPending}
        onSubmit={handleUpdate}
      />

      <AlertDialog
        open={Boolean(deletingTarefa)}
        onOpenChange={(open) => {
          if (!open) setDeletingTarefa(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove permanentemente a tarefa
              {deletingTarefa ? ` "${deletingTarefa.titulo}"` : ""}. Nao e possivel desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
              disabled={deleteTarefa.isPending}
            >
              {deleteTarefa.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Tarefas;
