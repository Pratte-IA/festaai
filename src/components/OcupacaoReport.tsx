import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, isDateInPeriod, ReportComponentProps, useReportData } from "@/features/reports";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const OcupacaoReport = ({ period }: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();
  const [showFilters, setShowFilters] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");

  const festas = useMemo(() => {
    return (data?.eventos ?? [])
      .filter((e) => e.tipo_evento === "festa" && isDateInPeriod(e.data_evento, period))
      .map((event) => {
        const date = new Date(`${event.data_evento}T12:00:00`);
        return {
          event,
          date,
          month: date.getMonth(),
          weekday: date.getDay(),
          weekdayLabel: WEEKDAYS[date.getDay()],
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, period]);

  const filtered = useMemo(() => {
    return festas.filter((f) => {
      if (monthFilter !== "all" && f.month !== Number(monthFilter)) return false;
      if (dayFilter !== "all" && f.weekday !== Number(dayFilter)) return false;
      return true;
    });
  }, [festas, monthFilter, dayFilter]);

  // Occupation rate: unique party dates / total days in filtered period
  const occupationRate = useMemo(() => {
    if (filtered.length === 0) return 0;
    const uniqueDates = new Set(filtered.map((f) => f.event.data_evento));
    // Estimate total available days based on filter
    let totalDays = 30; // default ~1 month
    if (monthFilter === "all") {
      const months = new Set(festas.map((f) => f.month));
      totalDays = months.size * 30;
    }
    if (dayFilter !== "all") {
      totalDays = Math.ceil(totalDays / 7);
    }
    return Math.min(100, Math.round((uniqueDates.size / totalDays) * 100));
  }, [filtered, festas, monthFilter, dayFilter]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ativo: "bg-success/15 text-success border-success/30",
      pendente: "bg-warning/15 text-warning border-warning/30",
      finalizado: "bg-muted text-muted-foreground border-border",
      novo: "bg-primary/15 text-primary border-primary/30",
    };
    return <Badge variant="outline" className={map[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {isLoading && <div className="glass-card p-4 text-sm text-muted-foreground">Carregando ocupação...</div>}
      {error && <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Nao foi possivel carregar o relatório.</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total de festas</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">Taxa de ocupação</p>
          </div>
          <p className="text-2xl font-bold text-primary">{occupationRate}%</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Média de convidados</p>
          <p className="text-2xl font-bold text-foreground">
            {filtered.length > 0
              ? Math.round(filtered.reduce((s, f) => s + (f.event.quantidade_convidados ?? 0), 0) / filtered.length)
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
        <div className="glass-card p-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mês</label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dia da semana</label>
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dias</SelectItem>
                {WEEKDAYS.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhuma festa encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pacote</TableHead>
                <TableHead className="text-center">Convidados</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.event.id}>
                  <TableCell>{formatDate(f.event.data_evento)}</TableCell>
                  <TableCell>{f.weekdayLabel}</TableCell>
                  <TableCell className="font-medium">{f.event.cliente_nome}</TableCell>
                  <TableCell>{f.event.pacote_nome ?? "Nao informado"}</TableCell>
                  <TableCell className="text-center">{f.event.quantidade_convidados ?? 0}</TableCell>
                  <TableCell>{statusBadge(f.event.status_interno)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default OcupacaoReport;
