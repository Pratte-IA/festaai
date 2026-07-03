import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Phone, AlertTriangle, Filter, ChevronDown, ChevronUp } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  isDateInPeriod,
  openWhatsApp,
  Priority,
  ReportComponentProps,
  useReportData,
} from "@/features/reports";
import { Evento } from "@/features/eventos";
import { isIsoDateBeforeToday, parseIsoDateLocal } from "@/lib/date";

interface RecompraClient {
  event: Evento;
  monthsSinceParty: number;
  previousAge: number;
  nextAge: number;
  priority: Priority;
}

const RecompraReport = ({ period }: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();
  const [showFilters, setShowFilters] = useState(false);
  const [minMonths, setMinMonths] = useState("");
  const [maxMonths, setMaxMonths] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [minTicket, setMinTicket] = useState("");
  const [maxTicket, setMaxTicket] = useState("");

  const clients = useMemo<RecompraClient[]>(() => {
    const now = new Date();

    return (data?.eventos ?? [])
      .filter((e) => e.funil === "executadas" && isDateInPeriod(e.data_evento, period) && e.data_evento && isIsoDateBeforeToday(e.data_evento))
      .filter((e) => Boolean(e.aniversariante_data_nascimento))
      .map((event) => {
        const partyDate = parseIsoDateLocal(event.data_evento ?? "");
        const birthDate = parseIsoDateLocal(event.aniversariante_data_nascimento ?? "");
        if (!partyDate || !birthDate) {
          return null;
        }

        const diffMs = now.getTime() - partyDate.getTime();
        const monthsSinceParty = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

        const ageAtParty = partyDate.getFullYear() - birthDate.getFullYear();
        const hadBirthdayByParty =
          partyDate.getMonth() > birthDate.getMonth() ||
          (partyDate.getMonth() === birthDate.getMonth() && partyDate.getDate() >= birthDate.getDate());
        const previousAge = hadBirthdayByParty ? ageAtParty : ageAtParty - 1;
        const nextAge = previousAge + 1;

        let priority: Priority = "baixa";
        if (monthsSinceParty >= 10 && monthsSinceParty <= 12) {
          priority = "alta";
        } else if (monthsSinceParty >= 8 && monthsSinceParty < 10) {
          priority = "media";
        }

        return { event, monthsSinceParty, previousAge, nextAge, priority };
      })
      .filter((item): item is RecompraClient => item !== null)
      .sort((a, b) => {
        const priorityOrder = { alta: 0, media: 1, baixa: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority] || b.monthsSinceParty - a.monthsSinceParty;
      });
  }, [data, period]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (minMonths && c.monthsSinceParty < Number(minMonths)) return false;
      if (maxMonths && c.monthsSinceParty > Number(maxMonths)) return false;
      if (minAge && c.nextAge < Number(minAge)) return false;
      if (maxAge && c.nextAge > Number(maxAge)) return false;
      if (minGuests && (c.event.quantidade_convidados ?? 0) < Number(minGuests)) return false;
      if (maxGuests && (c.event.quantidade_convidados ?? 0) > Number(maxGuests)) return false;
      if (minTicket && c.event.valor_total < Number(minTicket)) return false;
      if (maxTicket && c.event.valor_total > Number(maxTicket)) return false;
      return true;
    });
  }, [clients, minMonths, maxMonths, minAge, maxAge, minGuests, maxGuests, minTicket, maxTicket]);

  const priorityBadge = (priority: Priority) => {
    const styles = {
      alta: "bg-coral/15 text-coral border-coral/30",
      media: "bg-warning/15 text-warning border-warning/30",
      baixa: "bg-muted text-muted-foreground border-border",
    };
    const labels = { alta: "Alta prioridade", media: "Média", baixa: "Baixa" };
    return <Badge variant="outline" className={styles[priority]}>{labels[priority]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {isLoading && <div className="glass-card p-4 text-sm text-muted-foreground">Carregando clientes para recompra...</div>}
      {error && <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Nao foi possivel carregar o relatório.</div>}
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total de clientes</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-coral" />
            <p className="text-sm text-muted-foreground">Alta prioridade</p>
          </div>
          <p className="text-2xl font-bold text-coral">
            {filtered.filter((c) => c.priority === "alta").length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Ticket médio</p>
          <p className="text-2xl font-bold text-foreground">
            {filtered.length > 0
              ? formatCurrency(Math.round(filtered.reduce((sum, c) => sum + c.event.valor_total, 0) / filtered.length))
              : "—"}
          </p>
        </div>
      </div>

      {/* Filters toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        Filtros
        {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {showFilters && (
        <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Meses (mín)</label>
            <Input type="number" placeholder="0" value={minMonths} onChange={(e) => setMinMonths(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Meses (máx)</label>
            <Input type="number" placeholder="24" value={maxMonths} onChange={(e) => setMaxMonths(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Idade (mín)</label>
            <Input type="number" placeholder="1" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Idade (máx)</label>
            <Input type="number" placeholder="12" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Convidados (mín)</label>
            <Input type="number" placeholder="0" value={minGuests} onChange={(e) => setMinGuests(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Convidados (máx)</label>
            <Input type="number" placeholder="100" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ticket (mín)</label>
            <Input type="number" placeholder="0" value={minTicket} onChange={(e) => setMinTicket(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ticket (máx)</label>
            <Input type="number" placeholder="10000" value={maxTicket} onChange={(e) => setMaxTicket(e.target.value)} />
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhum cliente encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Aniversariante</TableHead>
                <TableHead className="text-center">Idade anterior</TableHead>
                <TableHead className="text-center">Próxima idade</TableHead>
                <TableHead>Última festa</TableHead>
                <TableHead className="text-center">Meses</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.event.id} className={c.priority === "alta" ? "bg-coral/5" : ""}>
                  <TableCell className="font-medium">{c.event.cliente_nome}</TableCell>
                  <TableCell>{c.event.aniversariante_nome ?? "Nao informado"}</TableCell>
                  <TableCell className="text-center">{c.previousAge} anos</TableCell>
                  <TableCell className="text-center font-semibold">{c.nextAge} anos</TableCell>
                  <TableCell>
                    {formatDate(c.event.data_evento)}
                  </TableCell>
                  <TableCell className="text-center font-semibold">{c.monthsSinceParty}m</TableCell>
                  <TableCell>{priorityBadge(c.priority)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-success hover:text-success"
                        onClick={() =>
                          openWhatsApp(
                            c.event.cliente_telefone,
                            c.event.cliente_nome,
                            "Olá {{nome}}! Tudo bem? Estamos com novidades para a próxima festinha!",
                          )
                        }
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => window.open(`tel:${c.event.cliente_telefone?.replace(/\D/g, "") ?? ""}`, "_self")}
                        title="Ligar"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
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

export default RecompraReport;
