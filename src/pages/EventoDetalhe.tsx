import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users, MessageCircle, Trophy, XCircle, MoreHorizontal, Trash2, ArrowRightLeft, PartyPopper, Phone, Edit3, Plus, Clock, Package, CreditCard, Cake } from "lucide-react";
import EventChecklist from "@/components/EventChecklist";
import AppLayout from "@/components/AppLayout";
import { mockEvents, Payment } from "@/data/mockEvents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const getTimeRemaining = (partyDate: string): string => {
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

const getTimeRemainingBadge = (partyDate: string) => {
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

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const calculateAge = (birthDate: string, partyDate: string): number => {
  const birth = new Date(birthDate);
  const party = new Date(partyDate);
  let age = party.getFullYear() - birth.getFullYear();
  const m = party.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && party.getDate() < birth.getDate())) age--;
  return age;
};

const stageLabels: Record<string, string> = {
  contato_inicial: "Contato Inicial",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  visita_agendada: "Visita Agendada",
  fechado: "Fechado",
  perdido: "Perdido",
  boas_vindas: "Boas Vindas",
  planejamento: "Planejamento",
  contrato: "Contrato",
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

interface Task {
  id: string;
  text: string;
  done: boolean;
}

interface Note {
  id: string;
  text: string;
  date: string;
}

const EventoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const event = mockEvents.find((e) => e.id === id);

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Enviar proposta comercial", done: true },
    { id: "2", text: "Confirmar pacote escolhido", done: false },
    { id: "3", text: "Agendar visita ao espaço", done: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const [notes, setNotes] = useState<Note[]>([
    { id: "1", text: "Cliente prefere tema de unicórnio. Mãe quer bolo personalizado.", date: "2026-04-10" },
  ]);
  const [newNote, setNewNote] = useState("");

  const [payments, setPayments] = useState<Payment[]>(event?.payments ?? []);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPaymentDate, setNewPaymentDate] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");

  if (!event) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Evento não encontrado.</p>
          <Button variant="ghost" onClick={() => navigate("/crm")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao CRM
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = event.totalValue - totalPaid;

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes((prev) => [
      { id: Date.now().toString(), text: newNote.trim(), date: new Date().toISOString().split("T")[0] },
      ...prev,
    ]);
    setNewNote("");
  };

  const addPayment = () => {
    const amount = parseFloat(newPaymentAmount);
    if (!newPaymentDate || isNaN(amount) || amount <= 0) return;
    setPayments((prev) => [
      ...prev,
      { id: Date.now().toString(), date: newPaymentDate, amount },
    ]);
    setNewPaymentDate("");
    setNewPaymentAmount("");
    setShowPaymentForm(false);
  };

  const celebratingAge = calculateAge(event.birthDate, event.partyDate);

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
              <h1 className="text-2xl font-bold text-foreground">{event.clientName}</h1>
              <p className="text-base text-muted-foreground flex items-center gap-1.5">
                <PartyPopper className="w-4 h-4" />
                {event.birthdayChildName}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Mover para outro funil
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Excluir lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(event.partyDate)}
            </span>
            <Badge variant={getTimeRemainingBadge(event.partyDate)}>
              {getTimeRemaining(event.partyDate)}
            </Badge>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {event.guestCount} convidados
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary">{funnelLabels[event.funnel]}</Badge>
            <span className="text-xs text-muted-foreground">→</span>
            <Badge variant="outline">{stageLabels[event.stage]}</Badge>
          </div>
        </div>

        {/* 2. AÇÕES RÁPIDAS */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button className="bg-[#25D366] hover:bg-[#1da851] text-white gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button className="bg-festa-blue hover:bg-festa-blue/90 text-white gap-2">
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
              <InfoRow label="Data da festa" value={formatDate(event.partyDate)} />
              <InfoRow label="Horário" value={event.partyTime} />
              <InfoRow label="Convidados" value={`${event.guestCount} pessoas`} />
              <InfoRow label="Pacote" value={event.selectedPackage} />
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
              <InfoRow label="Nome" value={event.birthdayChildName} />
              <InfoRow label="Data de nascimento" value={formatDate(event.birthDate)} />
              <InfoRow label="Idade a comemorar" value={`${celebratingAge} anos`} highlight />
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
              <InfoRow label="Telefone" value={event.phone} />
              <InfoRow label="Nome" value={event.clientName} />
            </CardContent>
          </Card>
        </div>

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
              <MiniStat label="Pacote" value={formatCurrency(event.packageValue)} />
              <MiniStat label="Adicionais" value={formatCurrency(event.addonsValue)} />
              <MiniStat label="Total" value={formatCurrency(event.totalValue)} highlight />
              <MiniStat label="Entrada" value={formatCurrency(event.downPayment)} />
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
              {payments.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Nenhum pagamento registrado</p>
              )}
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/30">
                  <span className="text-sm text-foreground">{formatDate(p.date)}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(p.amount)}</span>
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
                  <Button size="sm" onClick={addPayment}>Salvar</Button>
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

        {/* CHECKLIST DE ORGANIZAÇÃO — only for organização stage */}
        {event.stage === "organizacao" && (
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
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} />
                  <span className={`text-sm ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.text}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova tarefa..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={addTask}>
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
              <Button size="sm" variant="outline" onClick={addNote} className="self-end">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-muted/40 border border-border/30">
                  <p className="text-sm text-foreground">{note.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(note.date)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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
