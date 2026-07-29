import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Wallet } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinanceiroFestasOverview } from "@/features/financeiro";

const formatDate = (value: string | null) => {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

const FinanceiroPorFesta = () => {
  const [search, setSearch] = useState("");
  const { data: rows, error, isLoading } = useFinanceiroFestasOverview(search);

  const empty = !isLoading && !error && rows.length === 0;

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.contratado += row.valorContratado;
          acc.recebido += row.valorRecebido;
          acc.despesas += row.despesasRegistradas;
          acc.resultado += row.resultado;
          return acc;
        },
        { contratado: 0, recebido: 0, despesas: 0, resultado: 0 },
      ),
    [rows],
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Financeiro por festa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mostra receitas, recebimentos, despesas, saldo e resultado de uma festa específica.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Festas contratadas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Selecione uma festa para abrir o financeiro individual já existente.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por cliente ou aniversariante"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-destructive">
                Não foi possível carregar as festas. Tente novamente.
              </p>
            ) : null}

            {empty ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <Wallet className="h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhuma festa contratada encontrada.</p>
              </div>
            ) : null}

            {!isLoading && !error && rows.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Festa</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Contratado</TableHead>
                        <TableHead className="text-right">Recebido</TableHead>
                        <TableHead className="text-right">A receber</TableHead>
                        <TableHead className="text-right">Despesas</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.eventoId}>
                          <TableCell className="font-medium">
                            {row.aniversarianteNome || `Festa #${row.eventoId}`}
                          </TableCell>
                          <TableCell>{row.clienteNome}</TableCell>
                          <TableCell>{formatDate(row.dataEvento)}</TableCell>
                          <TableCell className="text-right">
                            {formatFinanceiroCurrency(row.valorContratado)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatFinanceiroCurrency(row.valorRecebido)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatFinanceiroCurrency(row.saldoAReceber)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatFinanceiroCurrency(row.despesasRegistradas)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatFinanceiroCurrency(row.resultado)}
                          </TableCell>
                          <TableCell>{row.statusLabel}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/crm/evento/${row.eventoId}/financeiro`}>Ver financeiro</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {rows.map((row) => (
                    <div key={row.eventoId} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {row.aniversarianteNome || `Festa #${row.eventoId}`}
                          </p>
                          <p className="text-sm text-muted-foreground">{row.clienteNome}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(row.dataEvento)} · {row.statusLabel}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/crm/evento/${row.eventoId}/financeiro`}>Ver financeiro</Link>
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Contratado</p>
                          <p>{formatFinanceiroCurrency(row.valorContratado)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Recebido</p>
                          <p>{formatFinanceiroCurrency(row.valorRecebido)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">A receber</p>
                          <p>{formatFinanceiroCurrency(row.saldoAReceber)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Resultado</p>
                          <p>{formatFinanceiroCurrency(row.resultado)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Totais na listagem: contratado {formatFinanceiroCurrency(totals.contratado)} ·
                  recebido {formatFinanceiroCurrency(totals.recebido)} · despesas{" "}
                  {formatFinanceiroCurrency(totals.despesas)} · resultado{" "}
                  {formatFinanceiroCurrency(totals.resultado)}
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FinanceiroPorFesta;
