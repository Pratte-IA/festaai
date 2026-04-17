import { useState, useMemo } from "react";
import { mockEvents, Event } from "@/data/mockEvents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Filter, ChevronDown, ChevronUp, Star } from "lucide-react";

interface PostSaleClient {
  event: Event;
  hasFeedback: boolean;
  daysSinceParty: number;
}

const PosVendaReport = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<string>("all");

  const clients = useMemo<PostSaleClient[]>(() => {
    const now = new Date();
    return mockEvents
      .filter((e) => e.funnel === "executadas")
      .map((event) => {
        const partyDate = new Date(event.partyDate);
        const daysSinceParty = Math.floor((now.getTime() - partyDate.getTime()) / (1000 * 60 * 60 * 24));
        // Simulate feedback: events in "redes_sociais" or "oportunidade_futura" stage have feedback
        const hasFeedback = event.stage !== "aguardando_feedback";
        return { event, hasFeedback, daysSinceParty };
      })
      .sort((a, b) => a.daysSinceParty - b.daysSinceParty);
  }, []);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (feedbackFilter === "sim" && !c.hasFeedback) return false;
      if (feedbackFilter === "nao" && c.hasFeedback) return false;
      return true;
    });
  }, [clients, feedbackFilter]);

  const feedbackRate = clients.length > 0
    ? Math.round((clients.filter((c) => c.hasFeedback).length / clients.length) * 100)
    : 0;

  const openWhatsApp = (phone: string, name: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${name}! Como foi a festinha? Adoraríamos saber sua opinião! ⭐`);
    window.open(`https://wa.me/55${cleaned}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Festas realizadas</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" />
            <p className="text-sm text-muted-foreground">Feedback coletado</p>
          </div>
          <p className="text-2xl font-bold text-warning">{feedbackRate}%</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Aguardando feedback</p>
          <p className="text-2xl font-bold text-foreground">
            {filtered.filter((c) => !c.hasFeedback).length}
          </p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
        <Filter className="w-4 h-4" />
        Filtros
        {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {showFilters && (
        <div className="glass-card p-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Feedback</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="sim">Com feedback</option>
              <option value="nao">Sem feedback</option>
            </select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhuma festa executada encontrada.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Aniversariante</TableHead>
                <TableHead>Data da festa</TableHead>
                <TableHead className="text-center">Dias atrás</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.event.id} className={!c.hasFeedback ? "bg-warning/5" : ""}>
                  <TableCell className="font-medium">{c.event.clientName}</TableCell>
                  <TableCell>{c.event.birthdayChildName}</TableCell>
                  <TableCell>{new Date(c.event.partyDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-center font-semibold">{c.daysSinceParty}d</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.hasFeedback ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>
                      {c.hasFeedback ? "Sim" : "Não"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {c.event.stage.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!c.hasFeedback && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-success hover:text-success"
                        onClick={() => openWhatsApp(c.event.phone, c.event.clientName)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden md:inline">Pedir feedback</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PosVendaReport;
