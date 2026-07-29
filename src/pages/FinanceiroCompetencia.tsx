import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Percent,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { FinanceiroMonthFilter } from "@/components/financeiro/FinanceiroMonthFilter";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCompetenciaMonthYear,
  getDefaultFinanceiroMonth,
  getFinanceiroCategoriaLabel,
  useFinanceiroCompetencia,
} from "@/features/financeiro";

const formatDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

const formatMargin = (value: number | null) => {
  if (value == null) {
    return "—";
  }

  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`;
};

const FinanceiroCompetencia = () => {
  const [month, setMonth] = useState(getDefaultFinanceiroMonth);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "Previsto" | "Realizado">("todos");

  const { data, error, isLoading } = useFinanceiroCompetencia({
    month,
    search,
    statusFilter,
  });

  const summary = data?.summary;
  const festas = data?.festas ?? [];
  const despesasOperacionais = data?.despesasOperacionais ?? [];

  const totalCards = useMemo(
    () => [
      {
        icon: ArrowUpCircle,
        label: "Receita das festas",
        value: summary ? formatFinanceiroCurrency(summary.receitaFestas) : "—",
      },
      {
        icon: ArrowDownCircle,
        label: "Custos diretos",
        value: summary ? formatFinanceiroCurrency(summary.custosDiretos) : "—",
      },
      {
        icon: TrendingUp,
        label: "Lucro bruto",
        value: summary ? formatFinanceiroCurrency(summary.lucroBruto) : "—",
      },
      {
        icon: Wallet,
        label: "Despesas operacionais",
        value: summary ? formatFinanceiroCurrency(summary.despesasOperacionais) : "—",
      },
      {
        icon: TrendingDown,
        label: "Resultado líquido",
        value: summary ? formatFinanceiroCurrency(summary.resultadoLiquido) : "—",
      },
      {
        icon: Percent,
        label: "Margem líquida",
        value: summary ? formatMargin(summary.margemLiquidaPercent) : "—",
      },
    ],
    [summary],
  );

  const splitCards = useMemo(
    () => [
      {
        label: "Receita prevista",
        hint: "Funil Festa (contratada, ainda não executada)",
        value: summary ? formatFinanceiroCurrency(summary.previsto.receitaFestas) : "—",
      },
      {
        label: "Receita realizada",
        hint: "Funil Executadas",
        value: summary ? formatFinanceiroCurrency(summary.realizado.receitaFestas) : "—",
      },
      {
        label: "Custos previstos",
        hint: "Custos das festas ainda no funil Festa",
        value: summary ? formatFinanceiroCurrency(summary.previsto.custosDiretos) : "—",
      },
      {
        label: "Custos realizados",
        hint: "Custos das festas no funil Executadas",
        value: summary ? formatFinanceiroCurrency(summary.realizado.custosDiretos) : "—",
      },
      {
        label: "Resultado previsto",
        hint: "Receita prevista − custos previstos",
        value: summary ? formatFinanceiroCurrency(summary.previsto.lucroBruto) : "—",
      },
      {
        label: "Resultado realizado",
        hint: "Receita realizada − custos realizados",
        value: summary ? formatFinanceiroCurrency(summary.realizado.lucroBruto) : "—",
      },
    ],
    [summary],
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Competência</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resultado das festas reconhecido no mês em que foram realizadas, independentemente das
            datas de recebimento e pagamento.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-4">
          <FinanceiroMonthFilter month={month} onMonthChange={setMonth} />
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar cliente ou aniversariante"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as situações</SelectItem>
              <SelectItem value="Previsto">Previsto</SelectItem>
              <SelectItem value="Realizado">Realizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-destructive">
            Não foi possível carregar o resultado por competência.
          </p>
        ) : null}

        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {totalCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  <p className="text-2xl font-semibold">{card.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-8">
          <p className="mb-3 text-sm font-medium text-foreground">Previsto × Realizado</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {splitCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{card.hint}</p>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28" />
                  ) : (
                    <p className="text-xl font-semibold">{card.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resultado por festa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Receita pelo valor contratado vigente no mês da data da festa — não pelos recebimentos
              parcelados. Previsto = funil Festa; Realizado = funil Executadas.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : festas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma festa elegível neste mês de competência.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Festa</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Pacote</TableHead>
                      <TableHead className="text-right">Valor contratado</TableHead>
                      <TableHead className="text-right">Custos diretos</TableHead>
                      <TableHead className="text-right">Lucro bruto</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {festas.map((festa) => (
                      <TableRow key={festa.eventoId}>
                        <TableCell className="font-medium">
                          {festa.festaLabel}
                          {festa.semReceitaCadastral ? (
                            <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">
                              Valor contratado zerado — revisar cadastro
                            </span>
                          ) : null}
                          {festa.alertaInconsistencia ? (
                            <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">
                              {festa.alertaInconsistencia}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>{festa.clienteNome}</TableCell>
                        <TableCell>{formatDate(festa.dataEvento)}</TableCell>
                        <TableCell>{festa.pacoteNome || "—"}</TableCell>
                        <TableCell className="text-right">
                          {formatFinanceiroCurrency(festa.valorContratado)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatFinanceiroCurrency(festa.custosDiretos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatFinanceiroCurrency(festa.lucroBruto)}
                        </TableCell>
                        <TableCell className="text-right">{formatMargin(festa.margemPercent)}</TableCell>
                        <TableCell>{festa.situacao}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/crm/evento/${festa.eventoId}/financeiro`}>Ver financeiro</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Despesas operacionais</CardTitle>
            <p className="text-sm text-muted-foreground">
              Somente saídas sem vínculo com festa, filtradas por data_competencia{" "}
              {formatCompetenciaMonthYear(`${month}-01`)}. Entradas gerais não entram aqui.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : despesasOperacionais.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma despesa operacional neste mês de competência.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesasOperacionais.map((despesa) => (
                      <TableRow key={despesa.id}>
                        <TableCell>{despesa.descricao || "—"}</TableCell>
                        <TableCell>{getFinanceiroCategoriaLabel(despesa.categoria)}</TableCell>
                        <TableCell>{formatCompetenciaMonthYear(despesa.dataCompetencia)}</TableCell>
                        <TableCell className="text-right">
                          {formatFinanceiroCurrency(despesa.valor)}
                        </TableCell>
                        <TableCell>{despesa.statusLabel}</TableCell>
                        <TableCell>{formatDate(despesa.dataPagamento)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link to="/financeiro?tab=saidas">Ver no fluxo</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FinanceiroCompetencia;
