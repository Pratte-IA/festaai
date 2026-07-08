import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, ChevronDown, ChevronUp, DollarSign, PartyPopper, Users } from "lucide-react";
import { EventoPackageLabel } from "@/components/eventos/EventoPackageLabel";
import { useTenantPackages } from "@/features/configuracoes";
import { Evento, filterExecutadasFunnelEventsByPartyDate } from "@/features/eventos";
import {
  formatCurrency,
  formatDate,
  ReportComponentProps,
  useReportData,
} from "@/features/reports";

const FestasExecutadasReport = ({ period: _period }: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();
  const { data: packages = [] } = useTenantPackages();
  const [showFilters, setShowFilters] = useState(false);
  const [clientFilter, setClientFilter] = useState("");
  const [childFilter, setChildFilter] = useState("");
  const [partyDateStart, setPartyDateStart] = useState("");
  const [partyDateEnd, setPartyDateEnd] = useState("");

  const events = useMemo<Evento[]>(() => {
    return filterExecutadasFunnelEventsByPartyDate(
      data?.eventos ?? [],
      partyDateStart || undefined,
      partyDateEnd || undefined,
    ).sort((a, b) => (b.data_evento ?? "").localeCompare(a.data_evento ?? ""));
  }, [data, partyDateStart, partyDateEnd]);

  const filtered = useMemo(() => {
    const normalizedClient = clientFilter.trim().toLowerCase();
    const normalizedChild = childFilter.trim().toLowerCase();

    return events.filter((event) => {
      // Festas canceladas ficam no funil Executadas apenas como oportunidade futura,
      // sem contar como festa realizada nas metricas deste relatorio.
      if (event.status_interno === "cancelado") return false;
      if (normalizedClient && !event.cliente_nome.toLowerCase().includes(normalizedClient)) return false;
      if (
        normalizedChild &&
        !(event.aniversariante_nome ?? "").toLowerCase().includes(normalizedChild)
      ) {
        return false;
      }
      return true;
    });
  }, [events, clientFilter, childFilter]);

  const totalSales = filtered.reduce((sum, event) => sum + event.valor_total, 0);
  const averageTicket = filtered.length > 0 ? totalSales / filtered.length : 0;
  const totalGuests = filtered.reduce((sum, event) => sum + (event.quantidade_convidados ?? 0), 0);
  const averageGuests = filtered.length > 0 ? Math.round(totalGuests / filtered.length) : 0;
  const hasPartyDateFilter = Boolean(partyDateStart || partyDateEnd);

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="glass-card p-4 text-sm text-muted-foreground">Carregando festas executadas...</div>
      )}
      {error && (
        <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Nao foi possivel carregar o relatório.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">Festas executadas</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          {hasPartyDateFilter && (
            <p className="mt-1 text-xs text-muted-foreground">Filtro de data da festa ativo</p>
          )}
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            <p className="text-sm text-muted-foreground">Valor total de vendas</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Ticket médio</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(averageTicket)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-festa-blue" />
            <p className="text-sm text-muted-foreground">Média de convidados</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{averageGuests}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
        {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {showFilters && (
        <div className="glass-card grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Cliente</label>
            <Input
              placeholder="Buscar por nome do cliente"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Criança</label>
            <Input
              placeholder="Buscar por nome da criança"
              value={childFilter}
              onChange={(event) => setChildFilter(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Data da festa — início</label>
            <Input
              type="date"
              value={partyDateStart}
              onChange={(event) => setPartyDateStart(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Data da festa — fim</label>
            <Input
              type="date"
              value={partyDateEnd}
              onChange={(event) => setPartyDateEnd(event.target.value)}
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhuma festa executada encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Criança</TableHead>
                <TableHead>Data da festa</TableHead>
                <TableHead className="text-center">Convidados</TableHead>
                <TableHead>Pacote</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/crm/evento/${event.id}`}
                      className="text-foreground transition-colors hover:text-primary hover:underline"
                    >
                      {event.cliente_nome}
                    </Link>
                  </TableCell>
                  <TableCell>{event.aniversariante_nome ?? "Nao informado"}</TableCell>
                  <TableCell>{formatDate(event.data_evento)}</TableCell>
                  <TableCell className="text-center">{event.quantidade_convidados ?? 0}</TableCell>
                  <TableCell>
                    <EventoPackageLabel evento={event} packages={packages} />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(event.valor_pacote)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default FestasExecutadasReport;
