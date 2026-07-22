import { useMemo } from "react";
import { PartyPopper, Percent, TrendingUp, UserPlus } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildCommercialActivityMonthlyReport } from "@/features/dashboard/build-commercial-activity-monthly-report";
import {
  formatCurrency,
  ReportComponentProps,
  useReportData,
} from "@/features/reports";

const AtividadeComercialReport = (_props: ReportComponentProps) => {
  const { data, error, isLoading } = useReportData();

  const rows = useMemo(
    () => buildCommercialActivityMonthlyReport(data?.eventos ?? [], data?.signedContracts ?? []),
    [data],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          closedParties: acc.closedParties + row.closedParties,
          leadsEntered: acc.leadsEntered + row.leadsEntered,
          soldValue: acc.soldValue + row.soldValue,
        }),
        { closedParties: 0, leadsEntered: 0, soldValue: 0 },
      ),
    [rows],
  );

  const overallConversion =
    totals.leadsEntered > 0 ? Math.round((totals.closedParties / totals.leadsEntered) * 100) : 0;

  // Mais recente primeiro na tabela
  const displayRows = useMemo(() => [...rows].reverse(), [rows]);

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="glass-card p-4 text-sm text-muted-foreground">
          Carregando atividade comercial...
        </div>
      )}
      {error && (
        <div className="glass-card border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar o relatório.
        </div>
      )}

      {!isLoading && !error && rows.length === 0 ? (
        <div className="glass-card p-4 text-sm text-muted-foreground">
          Ainda não há leads ou festas fechadas com contrato neste tenant.
        </div>
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Leads no período</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{totals.leadsEntered}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-success" />
                <p className="text-sm text-muted-foreground">Festas fechadas</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{totals.closedParties}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">Taxa de conversão</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{overallConversion}%</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rosa" />
                <p className="text-sm text-muted-foreground">Valor vendido</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(totals.soldValue)}
              </p>
            </div>
          </div>

          <div className="glass-card overflow-hidden p-0">
            <div className="border-b border-border/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Evolução mês a mês</h3>
              <p className="text-xs text-muted-foreground">
                Do primeiro mês com dados até o mês atual · festas fechadas = contrato assinado
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Leads que entraram</TableHead>
                  <TableHead className="text-right">Festas fechadas</TableHead>
                  <TableHead className="text-right">Taxa de conversão</TableHead>
                  <TableHead className="text-right">Valor vendido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row) => (
                  <TableRow key={row.monthKey}>
                    <TableCell className="font-medium text-foreground">{row.monthLabel}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.leadsEntered}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.closedParties}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.conversionRate}%</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.soldValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AtividadeComercialReport;
