import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Filter, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getEventOutstandingBalance,
  getEventTotalPaid,
  isDateInPeriod,
  openWhatsApp,
  Priority,
  ReportComponentProps,
  useReportData,
} from "@/features/reports";
import { Evento } from "@/features/eventos";

interface DebtClient {
  event: Evento;
  totalPaid: number;
  balance: number;
  priority: Priority;
}

const FinanceiroReport = ({ period }: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();
  const [showFilters, setShowFilters] = useState(false);
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  const clients = useMemo<DebtClient[]>(() => {
    if (!data) return [];

    return data.eventos
      .filter((e) => {
        if (e.funil === "executadas") return false;
        const balance = getEventOutstandingBalance(e, data.paidByEventoId);
        return isDateInPeriod(e.data_evento, period) && balance > 0;
      })
      .map((event) => {
        const totalPaid = getEventTotalPaid(event, data.paidByEventoId);
        const balance = getEventOutstandingBalance(event, data.paidByEventoId);
        const ratio = event.valor_total > 0 ? balance / event.valor_total : 0;

        let priority: Priority = "baixa";
        if (ratio >= 0.6) priority = "alta";
        else if (ratio >= 0.3) priority = "media";

        return { event, totalPaid, balance, priority };
      })
      .sort((a, b) => {
        const order = { alta: 0, media: 1, baixa: 2 };
        return order[a.priority] - order[b.priority] || b.balance - a.balance;
      });
  }, [data, period]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (minBalance && c.balance < Number(minBalance)) return false;
      if (maxBalance && c.balance > Number(maxBalance)) return false;
      if (minTotal && c.event.valor_total < Number(minTotal)) return false;
      if (maxTotal && c.event.valor_total > Number(maxTotal)) return false;
      return true;
    });
  }, [clients, minBalance, maxBalance, minTotal, maxTotal]);

  const totalOpen = filtered.reduce((s, c) => s + c.balance, 0);

  const priorityBadge = (p: Priority) => {
    const styles = {
      alta: "bg-coral/15 text-coral border-coral/30",
      media: "bg-warning/15 text-warning border-warning/30",
      baixa: "bg-muted text-muted-foreground border-border",
    };
    const labels = { alta: "Alto", media: "Médio", baixa: "Baixo" };
    return <Badge variant="outline" className={styles[p]}>{labels[p]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {isLoading && <div className="glass-card p-4 text-sm text-muted-foreground">Carregando relatório financeiro...</div>}
      {error && <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Nao foi possivel carregar o relatório.</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Clientes com saldo</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-coral" />
            <p className="text-sm text-muted-foreground">Total em aberto</p>
          </div>
          <p className="text-2xl font-bold text-coral">
            {formatCurrency(totalOpen)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Ticket médio em aberto</p>
          <p className="text-2xl font-bold text-foreground">
            {filtered.length > 0
              ? formatCurrency(Math.round(totalOpen / filtered.length))
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
            <label className="text-xs text-muted-foreground mb-1 block">Saldo mínimo</label>
            <Input type="number" placeholder="0" value={minBalance} onChange={(e) => setMinBalance(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Saldo máximo</label>
            <Input type="number" placeholder="10000" value={maxBalance} onChange={(e) => setMaxBalance(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor total (mín)</label>
            <Input type="number" placeholder="0" value={minTotal} onChange={(e) => setMinTotal(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor total (máx)</label>
            <Input type="number" placeholder="10000" value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhum cliente com saldo devedor encontrado.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data da festa</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Saldo devedor</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.event.id} className={c.priority === "alta" ? "bg-coral/5" : ""}>
                  <TableCell className="font-medium">{c.event.cliente_nome}</TableCell>
                  <TableCell>{formatDate(c.event.data_evento)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.event.valor_total)}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(c.totalPaid)}</TableCell>
                  <TableCell className="text-right font-semibold text-coral">{formatCurrency(c.balance)}</TableCell>
                  <TableCell>{priorityBadge(c.priority)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-success hover:text-success"
                      onClick={() =>
                        openWhatsApp(
                          c.event.cliente_telefone,
                          c.event.cliente_nome,
                          `Olá {{nome}}! Passando para lembrar sobre o saldo de ${formatCurrency(c.balance)} referente à festinha. Podemos conversar?`,
                        )
                      }
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden md:inline">Cobrar</span>
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

export default FinanceiroReport;
