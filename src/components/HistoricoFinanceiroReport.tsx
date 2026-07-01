import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronDown, ChevronUp, ArrowDownLeft, Receipt } from "lucide-react";
import {
  buildHistoricoFinanceiroEntries,
  formatCurrency,
  formatDate,
  ReportComponentProps,
  useReportData,
  type FinancialEntryType,
} from "@/features/reports";

const typeLabels: Record<FinancialEntryType, string> = {
  entrada: "Entrada",
  pagamento: "Pagamento",
  quitacao: "Quitação",
};

const typeBadgeStyles: Record<FinancialEntryType, string> = {
  entrada: "bg-primary/15 text-primary border-primary/30",
  pagamento: "bg-success/15 text-success border-success/30",
  quitacao: "bg-success/15 text-success border-success/30",
};

const HistoricoFinanceiroReport = ({ period }: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();
  const [showFilters, setShowFilters] = useState(false);
  const [clientFilter, setClientFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<FinancialEntryType | "all">("all");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  const entries = useMemo(
    () =>
      data
        ? buildHistoricoFinanceiroEntries({
            eventos: data.eventos,
            pagamentos: data.pagamentos,
            paidByEventoId: data.paidByEventoId,
            period,
          })
        : [],
    [data, period],
  );

  const filtered = useMemo(() => {
    const normalizedClient = clientFilter.trim().toLowerCase();

    return entries.filter((entry) => {
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      if (normalizedClient && !entry.cliente.toLowerCase().includes(normalizedClient)) return false;
      if (minValue && entry.valor < Number(minValue)) return false;
      if (maxValue && entry.valor > Number(maxValue)) return false;
      return true;
    });
  }, [entries, clientFilter, typeFilter, minValue, maxValue]);

  const totalReceived = filtered.reduce((sum, entry) => sum + entry.valor, 0);
  const totalEntradas = filtered.filter((entry) => entry.type === "entrada").reduce((sum, entry) => sum + entry.valor, 0);
  const totalPagamentos = filtered
    .filter((entry) => entry.type === "pagamento" || entry.type === "quitacao")
    .reduce((sum, entry) => sum + entry.valor, 0);

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="glass-card p-4 text-sm text-muted-foreground">Carregando histórico financeiro...</div>
      )}
      {error && (
        <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Nao foi possivel carregar o histórico financeiro.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-success" />
            <p className="text-sm text-muted-foreground">Total recebido</p>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Pagamentos e quitações</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPagamentos)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Transações</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
        {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {showFilters && (
        <div className="glass-card grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Cliente</label>
            <Input placeholder="Buscar por nome" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FinancialEntryType | "all")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="pagamento">Pagamento</option>
              <option value="quitacao">Quitação</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Valor mínimo</label>
            <Input type="number" placeholder="0" value={minValue} onChange={(e) => setMinValue(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Valor máximo</label>
            <Input type="number" placeholder="10000" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhuma movimentação financeira encontrada no período selecionado.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data da festa</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeBadgeStyles[entry.type]}>
                      <ArrowDownLeft className="mr-1 h-3 w-3" />
                      {typeLabels[entry.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      to={`/crm/evento/${entry.eventoId}`}
                      className="text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {entry.cliente}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(entry.dataEvento)}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.metodo ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold text-success">{formatCurrency(entry.valor)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{entry.observacao ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default HistoricoFinanceiroReport;
