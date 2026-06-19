import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users, MessageCircle, Trophy, XCircle, MoreHorizontal, Trash2, ArrowRightLeft, PartyPopper, Phone, Edit3, Plus, Clock, Package, CreditCard, Cake } from "lucide-react";
import { EventoFormDialog, EventoFormValues } from "@/components/eventos/EventoFormDialog";
import { ClosingFormDialog } from "@/components/eventos/ClosingFormDialog";
import { MoveEventoFunnelDialog } from "@/components/eventos/MoveEventoFunnelDialog";
import { EventoFormResponsesCard } from "@/components/eventos/EventoFormResponsesCard";
import EventChecklist from "@/components/EventChecklist";
import AppLayout from "@/components/AppLayout";
import {
  useCreateEventoNota,
  useCreateEventoPagamento,
  useCreateEventoTarefa,
  useDeleteEvento,
  useEvento,
  useEventoNotas,
  useEventoPagamentos,
  useEventoTarefas,
  useUpdateEvento,
  useToggleEventoTarefa,
} from "@/features/eventos";
import { useTenantAdminCapability } from "@/features/tenants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const getTimeRemaining = (partyDate: string | null): string => {
  if (!partyDate) return "Sem data";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const party = new Date(partyDate);
  party.setHours(0, 0, 0, 0);
  const diffDays = Math.round((party.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Realizada";
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  return `Faltam ${diffDays} dias`;
};

const getTimeRemainingBadge = (partyDate: string | null) => {
  if (!partyDate) return "outline" as const;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const party = new Date(partyDate);
  party.setHours(0, 0, 0, 0);
  const diffDays = Math.round((party.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "secondary" as const;
  if (diffDays <= 1) return "destructive" as const;
  if (diffDays <= 7) return "default" as const;
  return "outline" as const;
};

const formatDate = (date: string | null) => {
  if (!date) return "Nao informado";

  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (time: string | null) => {
  if (!time) return "Nao informado";

  return time.slice(0, 5);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const calculateAge = (birthDate: string | null, partyDate: string | null): string => {
  if (!birthDate || !partyDate) return "Nao informado";

  const birth = new Date(birthDate);
  const party = new Date(partyDate);
  let age = party.getFullYear() - birth.getFullYear();
  const m = party.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && party.getDate() < birth.getDate())) age--;
  return `${age} anos`;
};

const stageLabels: Record<string, string> = {
  contato_inicial: "Contato Inicial",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  visita_agendada: "Visita Agendada",
  contrato: "Contrato",
  perdido: "Perdido",
  boas_vindas: "Boas Vindas",
  planejamento: "Planejamento",
  organizacao: "Organização",
  festa_pronta: "Festa Pronta",
  aguardando_feedback: "Aguardando Feedback",
  redes_sociais: "Redes Sociais",
  oportunidade_futura: "Oportunidade Futura",
};

const funnelLabels: Record<string, string> = {
  vendas: "Vendas",
  festa: "Festa",
  executadas: "Executadas",
};

const EventoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventoId = id ? Number(id) : null;
  const isValidEventoId = Number.isInteger(eventoId) && Number(eventoId) > 0;
  const validEventoId = isValidEventoId ? Number(eventoId) : null;
  const { data: event, error, isLoading } = useEvento(validEventoId);
  const { data: payments = [], isLoading: isPaymentsLoading } = useEventoPagamentos(validEventoId);
  const { data: tasks = [], isLoading: isTasksLoading } = useEventoTarefas(validEventoId);
  const { data: notes = [], isLoading: isNotesLoading } = useEventoNotas(validEventoId);
  const createPagamento = useCreateEventoPagamento();
  const createTarefa = useCreateEventoTarefa();
  const toggleTarefa = useToggleEventoTarefa();
  const createNota = useCreateEventoNota();
  const updateEvento = useUpdateEvento();
  const deleteEvento = useDeleteEvento();
  const { data: adminCapability } = useTenantAdminCapability();

  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPaymentDate, setNewPaymentDate] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false);
  const [isMoveFunnelOpen, setIsMoveFunnelOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </AppLayout>
    );
  }

  if (!isValidEventoId || error || !event) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">
            {error ? "Nao foi possivel carregar este evento." : "Evento nao encontrado."}
          </p>
          <Button variant="ghost" onClick={() => navigate("/crm")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao CRM
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalPaid = event.valor_entrada + payments.reduce((sum, p) => sum + p.valor, 0);
  const balance = event.valor_total - totalPaid;

  const addTask = async () => {
    const titulo = newTask.trim();

    if (!validEventoId || !titulo) return;

    try {
      await createTarefa.mutateAsync({
        eventoId: validEventoId,
        titulo,
      });
    } catch {
      toast({
        title: "Nao foi possivel salvar a tarefa",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    setNewTask("");
  };

  const toggleTask = async (taskId: number, concluida: boolean) => {
    if (!validEventoId) return;

    try {
      await toggleTarefa.mutateAsync({
        concluida,
        eventoId: validEventoId,
        tarefaId: taskId,
      });
    } catch {
      toast({
        title: "Nao foi possivel atualizar a tarefa",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const addNote = async () => {
    const texto = newNote.trim();

    if (!validEventoId || !texto) return;

    try {
      await createNota.mutateAsync({
        eventoId: validEventoId,
        texto,
      });
    } catch {
      toast({
        title: "Nao foi possivel salvar a anotacao",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    setNewNote("");
  };

  const addPayment = async () => {
    const amount = parseFloat(newPaymentAmount);

    if (!validEventoId || !newPaymentDate || isNaN(amount) || amount <= 0) return;

    try {
      await createPagamento.mutateAsync({
        data_pagamento: newPaymentDate,
        eventoId: validEventoId,
        valor: amount,
      });
    } catch {
      toast({
        title: "Nao foi possivel salvar o pagamento",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    setNewPaymentDate("");
    setNewPaymentAmount("");
    setShowPaymentForm(false);
  };

  const celebratingAge = calculateAge(event.aniversariante_data_nascimento, event.data_evento);

  const handleUpdateEvento = async (values: EventoFormValues) => {
    if (!validEventoId) return;

    try {
      await updateEvento.mutateAsync({
        eventoId: validEventoId,
        values,
      });

      toast({
        title: "Evento atualizado",
        description: "As informacoes foram salvas com sucesso.",
      });
      setIsEditDialogOpen(false);
    } catch {
      toast({
        title: "Nao foi possivel atualizar o evento",
        description: "Revise os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvento = async () => {
    if (!validEventoId) return;

    try {
      await deleteEvento.mutateAsync(validEventoId);
      toast({
        title: "Lead excluido",
        description: "O registro foi removido do CRM.",
      });
      navigate("/crm", { replace: true });
    } catch {
      toast({
        title: "Nao foi possivel excluir o lead",
        description: "Apenas administradores podem excluir leads. Tente novamente se tiver permissao.",
        variant: "destructive",
      });
    }
  };

  const canDeleteLead = adminCapability?.isTenantAdmin ?? false;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate("/crm")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao CRM
        </button>

        {/* 1. HEADER */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">{event.cliente_nome}</h1>
              <p className="text-base text-muted-foreground flex items-center gap-1.5">
                <PartyPopper className="w-4 h-4" />
                {event.aniversariante_nome ?? "Aniversariante nao informado"}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit3 className="w-4 h-4" />
                  Editar evento
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => setIsMoveFunnelOpen(true)}>
                  <ArrowRightLeft className="w-4 h-4" />
                  Mover para outro funil
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  disabled={!canDeleteLead}
                  onClick={() => {
                    if (!canDeleteLead) return;
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(event.data_evento)}
            </span>
            <Badge variant={getTimeRemainingBadge(event.data_evento)}>
              {getTimeRemaining(event.data_evento)}
            </Badge>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {event.quantidade_convidados ?? 0} convidados
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary">{funnelLabels[event.funil]}</Badge>
            <span className="text-xs text-muted-foreground">→</span>
            <Badge variant="outline">{stageLabels[event.etapa]}</Badge>
          </div>
        </div>

        {/* 2. AÇÕES RÁPIDAS */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="outline" className="gap-2" onClick={() => setIsEditDialogOpen(true)}>
            <Edit3 className="w-4 h-4" />
            Editar evento
          </Button>
          <Button className="bg-[#25D366] hover:bg-[#1da851] text-white gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button
            className="bg-festa-blue hover:bg-festa-blue/90 text-white gap-2"
            onClick={() => setIsClosingDialogOpen(true)}
            disabled={event.funil !== "vendas" || event.etapa === "perdido"}
          >
            <Trophy className="w-4 h-4" />
            Marcar como Vendido
          </Button>
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 gap-2">
            <XCircle className="w-4 h-4" />
            Marcar como Perdido
          </Button>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 3. DETALHES DA FESTA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-festa-rosa" />
                Detalhes da Festa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Data da festa" value={formatDate(event.data_evento)} />
              <InfoRow label="Horario" value={formatTime(event.hora_evento)} />
              <InfoRow label="Convidados" value={`${event.quantidade_convidados ?? 0} pessoas`} />
              <InfoRow label="Pacote" value={event.pacote_nome ?? "Pacote nao informado"} />
            </CardContent>
          </Card>

          {/* 4. ANIVERSARIANTE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cake className="w-4 h-4 text-festa-coral" />
                Aniversariante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Nome" value={event.aniversariante_nome ?? "Nao informado"} />
              <InfoRow label="Data de nascimento" value={formatDate(event.aniversariante_data_nascimento)} />
              <InfoRow label="Idade a comemorar" value={celebratingAge} highlight />
            </CardContent>
          </Card>

          {/* 5. CONTATO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-festa-blue" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Telefone" value={event.cliente_telefone ?? "Nao informado"} />
              <InfoRow label="E-mail" value={event.cliente_email ?? "Nao informado"} />
              <InfoRow label="Nome" value={event.cliente_nome} />
            </CardContent>
          </Card>
        </div>

        {validEventoId ? (
          <EventoFormResponsesCard
            eventoId={validEventoId}
            hasFormSubmission={Boolean(event.fechamento_confirmado_em)}
          />
        ) : null}

        {/* 6. SITUAÇÃO FINANCEIRA — full width */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-festa-blue" />
              Situação Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <MiniStat label="Pacote" value={formatCurrency(event.valor_pacote)} />
              <MiniStat label="Adicionais" value={formatCurrency(event.valor_adicionais)} />
              <MiniStat label="Total" value={formatCurrency(event.valor_total)} highlight />
              <MiniStat label="Entrada" value={formatCurrency(event.valor_entrada)} />
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <MiniStat label="Total pago" value={formatCurrency(totalPaid)} />
              <MiniStat
                label="Saldo devedor"
                value={formatCurrency(balance)}
                highlight
                negative={balance > 0}
              />
            </div>

            <Separator className="my-4" />

            {/* Payments list */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pagamentos realizados</p>
              {isPaymentsLoading && (
                <p className="text-sm text-muted-foreground italic">Carregando pagamentos...</p>
              )}
              {!isPaymentsLoading && payments.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Nenhum pagamento registrado</p>
              )}
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/30">
                  <span className="text-sm text-foreground">{formatDate(p.data_pagamento)}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(p.valor)}</span>
                </div>
              ))}
            </div>

            {/* Add payment */}
            {showPaymentForm ? (
              <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-border/60 bg-muted/20">
                <Input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  className="text-sm"
                  min="0"
                  step="0.01"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addPayment} disabled={createPagamento.isPending}>Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowPaymentForm(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowPaymentForm(true)}>
                <Plus className="w-4 h-4" />
                Adicionar pagamento
              </Button>
            )}
          </CardContent>
        </Card>

        {shouldShowEventoContractCard(event) && <EventoContractCard evento={event} />}

        {/* CHECKLIST DE ORGANIZAÇÃO — only for organização stage */}
        {event.etapa === "organizacao" && (
          <div className="mt-4">
            <EventChecklist />
          </div>
        )}

        {/* 7. TAREFAS */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-festa-blue" />
              Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {isTasksLoading && (
                <p className="text-sm text-muted-foreground italic">Carregando tarefas...</p>
              )}
              {!isTasksLoading && tasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Nenhuma tarefa registrada</p>
              )}
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={task.concluida}
                    onCheckedChange={(checked) => toggleTask(task.id, checked === true)}
                  />
                  <span className={`text-sm ${task.concluida ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.titulo}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova tarefa..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void addTask();
                  }
                }}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={addTask} disabled={createTarefa.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 8. ANOTAÇÕES */}
        <Card className="mt-4 mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              📝 Anotações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="Adicionar anotação..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <Button size="sm" variant="outline" onClick={addNote} className="self-end" disabled={createNota.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {isNotesLoading && (
                <p className="text-sm text-muted-foreground italic">Carregando anotacoes...</p>
              )}
              {!isNotesLoading && notes.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Nenhuma anotacao registrada</p>
              )}
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-muted/40 border border-border/30">
                  <p className="text-sm text-foreground">{note.texto}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(note.created_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <EventoFormDialog
        initialEvento={event}
        isSubmitting={updateEvento.isPending}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateEvento}
        open={isEditDialogOpen}
      />

      <ClosingFormDialog
        evento={event}
        onOpenChange={setIsClosingDialogOpen}
        onSuccess={() => {
          toast({
            title: "Festa fechada",
            description: "Os dados foram confirmados e a festa avançou para o funil Festa.",
          });
        }}
        open={isClosingDialogOpen}
      />

      <MoveEventoFunnelDialog
        evento={event}
        onOpenChange={setIsMoveFunnelOpen}
        open={isMoveFunnelOpen}
      />

      <AlertDialog onOpenChange={setIsDeleteOpen} open={isDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove permanentemente o lead de {event.cliente_nome}, incluindo tarefas,
              anotacoes, pagamentos e contratos vinculados. Nao e possivel desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEvento.isPending}
              onClick={() => void handleDeleteEvento()}
            >
              Excluir lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

const InfoRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm ${highlight ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
      {value}
    </span>
  </div>
);

const MiniStat = ({ label, value, highlight, negative }: { label: string; value: string; highlight?: boolean; negative?: boolean }) => (
  <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/30">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-sm font-semibold ${negative ? "text-destructive" : highlight ? "text-foreground" : "text-foreground"}`}>
      {value}
    </p>
  </div>
);

export default EventoDetalhe;
