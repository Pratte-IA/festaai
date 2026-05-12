import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, AlertTriangle, Filter, ChevronDown, ChevronUp } from "lucide-react";
import {
  daysBetween,
  isDateInPeriod,
  openWhatsApp,
  Priority,
  ReportComponentProps,
  useReportData,
} from "@/features/reports";
import { Evento } from "@/features/eventos";

interface LostLead {
  event: Evento;
  daysSinceEntry: number;
  daysSinceUpdate: number;
  priority: Priority;
}

const LeadsPerdidosReport = ({ period }: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();
  const [showFilters, setShowFilters] = useState(false);
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");

  const leads = useMemo<LostLead[]>(() => {
    return (data?.eventos ?? [])
      .filter((e) => {
        if (e.funil !== "vendas") return false;
        if (e.etapa === "fechado") return false;
        if (!isDateInPeriod(e.created_at.split("T")[0], period)) return false;
        return daysBetween(e.created_at) >= 7;
      })
      .map((event) => {
        const daysSinceEntry = daysBetween(event.created_at);
        const daysSinceUpdate = daysBetween(event.updated_at);

        let priority: Priority = "baixa";
        if (daysSinceUpdate >= 10) priority = "alta";
        else if (daysSinceUpdate >= 5) priority = "media";

        return { event, daysSinceEntry, daysSinceUpdate, priority };
      })
      .sort((a, b) => {
        const order = { alta: 0, media: 1, baixa: 2 };
        return order[a.priority] - order[b.priority] || b.daysSinceUpdate - a.daysSinceUpdate;
      });
  }, [data, period]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (minDays && l.daysSinceEntry < Number(minDays)) return false;
      if (maxDays && l.daysSinceEntry > Number(maxDays)) return false;
      if (minGuests && (l.event.quantidade_convidados ?? 0) < Number(minGuests)) return false;
      if (maxGuests && (l.event.quantidade_convidados ?? 0) > Number(maxGuests)) return false;
      return true;
    });
  }, [leads, minDays, maxDays, minGuests, maxGuests]);

  const priorityBadge = (p: Priority) => {
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
      {isLoading && <div className="glass-card p-4 text-sm text-muted-foreground">Carregando leads perdidos...</div>}
      {error && <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Nao foi possivel carregar o relatório.</div>}
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
                  <TableCell className="font-medium">{l.event.cliente_nome}</TableCell>
                  <TableCell>{new Date(l.event.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-center">{l.event.quantidade_convidados ?? 0}</TableCell>
                  <TableCell className="text-center font-semibold">{l.daysSinceUpdate}d</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {l.event.etapa.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{priorityBadge(l.priority)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-success hover:text-success"
                      onClick={() =>
                        openWhatsApp(
                          l.event.cliente_telefone,
                          l.event.cliente_nome,
                          "Olá {{nome}}! Tudo bem? Gostaríamos de retomar o contato sobre a festinha!",
                        )
                      }
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
