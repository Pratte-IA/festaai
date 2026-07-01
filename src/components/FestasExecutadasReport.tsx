import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, ChevronDown, ChevronUp, PartyPopper, Users } from "lucide-react";
import { EventoPackageLabel } from "@/components/eventos/EventoPackageLabel";
import { useTenantPackages } from "@/features/configuracoes";
import { Evento } from "@/features/eventos";
import {
  formatDate,
  isDateInPeriod,
  ReportComponentProps,
  useReportData,
} from "@/features/reports";

const FestasExecutadasReport = ({ period }: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();
  const { data: packages = [] } = useTenantPackages();
  const [showFilters, setShowFilters] = useState(false);
  const [clientFilter, setClientFilter] = useState("");
  const [childFilter, setChildFilter] = useState("");

  const events = useMemo<Evento[]>(() => {
    return (data?.eventos ?? [])
      .filter((event) => event.funil === "executadas" && isDateInPeriod(event.data_evento, period))
      .sort((a, b) => (b.data_evento ?? "").localeCompare(a.data_evento ?? ""));
  }, [data, period]);

  const filtered = useMemo(() => {
    const normalizedClient = clientFilter.trim().toLowerCase();
    const normalizedChild = childFilter.trim().toLowerCase();

    return events.filter((event) => {
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

  const totalGuests = filtered.reduce((sum, event) => sum + (event.quantidade_convidados ?? 0), 0);

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">Festas executadas</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-festa-blue" />
            <p className="text-sm text-muted-foreground">Total de convidados</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalGuests}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Média de convidados</p>
          <p className="text-2xl font-bold text-foreground">
            {filtered.length > 0 ? Math.round(totalGuests / filtered.length) : 0}
          </p>
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
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhuma festa executada encontrada no período selecionado.
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
