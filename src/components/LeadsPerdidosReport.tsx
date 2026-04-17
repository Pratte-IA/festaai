import { useState, useMemo } from "react";
import { mockEvents, Event } from "@/data/mockEvents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, AlertTriangle, Filter, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface LostLead {
  event: Event;
  daysSinceEntry: number;
  daysSinceUpdate: number;
  priority: "alta" | "media" | "baixa";
}

const LeadsPerdidosReport = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");

  const leads = useMemo<LostLead[]>(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return mockEvents
      .filter((e) => {
        if (e.funnel !== "vendas") return false;
        if (e.stage === "fechado") return false;
        const created = new Date(e.createdAt);
        return created < sevenDaysAgo;
      })
      .map((event) => {
        const created = new Date(event.createdAt);
        const updated = new Date(event.updatedAt);
        const daysSinceEntry = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));

        let priority: "alta" | "media" | "baixa" = "baixa";
        if (daysSinceUpdate >= 10) priority = "alta";
        else if (daysSinceUpdate >= 5) priority = "media";

        return { event, daysSinceEntry, daysSinceUpdate, priority };
      })
      .sort((a, b) => {
        const order = { alta: 0, media: 1, baixa: 2 };
        return order[a.priority] - order[b.priority] || b.daysSinceUpdate - a.daysSinceUpdate;
      });
  }, []);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (minDays && l.daysSinceEntry < Number(minDays)) return false;
      if (maxDays && l.daysSinceEntry > Number(maxDays)) return false;
      if (minGuests && l.event.guestCount < Number(minGuests)) return false;
      if (maxGuests && l.event.guestCount > Number(maxGuests)) return false;
      return true;
    });
  }, [leads, minDays, maxDays, minGuests, maxGuests]);

  const openWhatsApp = (phone: string, name: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${name}! Tudo bem? Gostaríamos de retomar o contato sobre a festinha! 🎉`);
    window.open(`https://wa.me/55${cleaned}?text=${msg}`, "_blank");
  };

  const priorityBadge = (p: "alta" | "media" | "baixa") => {
    const styles = {
      alta: "bg-coral/15 text-coral border-coral/30",
      media: "bg-warning/15 text-warning border-warning/30",
      baixa: "bg-muted text-muted-foreground border-border",
    };
    const labels = { alta: "Alta prioridade", media: "Média", baixa: "Baixa" };
    return <Badge variant="outline" className={styles[p]}>{labels[p]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total de leads perdidos</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-coral" />
            <p className="text-sm text-muted-foreground">Alta prioridade</p>
          </div>
          <p className="text-2xl font-bold text-coral">
            {filtered.filter((l) => l.priority === "alta").length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Média dias sem contato</p>
          <p className="text-2xl font-bold text-foreground">
            {filtered.length > 0
              ? `${Math.round(filtered.reduce((s, l) => s + l.daysSinceUpdate, 0) / filtered.length)} dias`
              : "—"}
          </p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
        <Filter className="w-4 h-4" />
        Filtros
        {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {showFilters && (
        <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dias desde entrada (mín)</label>
            <Input type="number" placeholder="0" value={minDays} onChange={(e) => setMinDays(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dias desde entrada (máx)</label>
            <Input type="number" placeholder="30" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Convidados (mín)</label>
            <Input type="number" placeholder="0" value={minGuests} onChange={(e) => setMinGuests(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Convidados (máx)</label>
            <Input type="number" placeholder="100" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhum lead perdido encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data de entrada</TableHead>
                <TableHead className="text-center">Convidados</TableHead>
                <TableHead className="text-center">Dias sem contato</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.event.id} className={l.priority === "alta" ? "bg-coral/5" : ""}>
                  <TableCell className="font-medium">{l.event.clientName}</TableCell>
                  <TableCell>{new Date(l.event.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-center">{l.event.guestCount}</TableCell>
                  <TableCell className="text-center font-semibold">{l.daysSinceUpdate}d</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {l.event.stage.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{priorityBadge(l.priority)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-success hover:text-success"
                      onClick={() => openWhatsApp(l.event.phone, l.event.clientName)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden md:inline">Reativar</span>
                    </Button>
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

export default LeadsPerdidosReport;
