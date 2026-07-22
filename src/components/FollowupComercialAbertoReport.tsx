import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buildComercialFollowupOpenReport } from "@/features/dashboard/build-comercial-followup-open-report";
import { ReportComponentProps, useReportData } from "@/features/reports";
import { formatDateBR } from "@/lib/date";

const FollowupComercialAbertoReport = (_props: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();

  const rows = useMemo(
    () => buildComercialFollowupOpenReport(data?.eventos ?? []),
    [data?.eventos],
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="glass-card p-4 text-sm text-muted-foreground">
          Carregando follows em aberto...
        </div>
      ) : null}

      {error ? (
        <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Nao foi possivel carregar o relatório.
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Follows em aberto</p>
            <p className="text-2xl font-bold text-foreground">{rows.length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Contato inicial</p>
            <p className="text-2xl font-bold text-foreground">
              {rows.filter((row) => row.etapa === "contato_inicial").length}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Proposta enviada</p>
            <p className="text-2xl font-bold text-foreground">
              {rows.filter((row) => row.etapa === "proposta_enviada").length}
            </p>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && rows.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhum cliente na esteira de follow-up comercial no momento.
        </div>
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Aniversariante</TableHead>
                <TableHead>Data da festa</TableHead>
                <TableHead>Follow</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.eventoId}>
                  <TableCell className="font-medium">{row.clienteNome}</TableCell>
                  <TableCell>{row.aniversarianteNome}</TableCell>
                  <TableCell>{row.dataFesta ? formatDateBR(row.dataFesta) : "Sem data"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap font-normal">
                      {row.followLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.etapaLabel}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      aria-label={`Abrir evento de ${row.clienteNome}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                      to={`/crm/evento/${row.eventoId}`}
                    >
                      Ver
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
};

export default FollowupComercialAbertoReport;
