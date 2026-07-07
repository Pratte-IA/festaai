import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Eye, MoreHorizontal, Search, Star } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSatisfactionSurveySubmissionStatus,
  satisfactionSurveySubmissionStatusLabels,
  type TenantSatisfactionSurveySubmissionListItem,
  useTenantSatisfactionSurveySubmissions,
} from "@/features/configuracoes";

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const matchesSearch = (item: TenantSatisfactionSurveySubmissionListItem, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [item.clienteNome, item.aniversarianteNome, item.pacoteNome]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
};

const StatusBadge = ({ item }: { item: TenantSatisfactionSurveySubmissionListItem }) => {
  const status = getSatisfactionSurveySubmissionStatus(item);

  return (
    <Badge
      variant="outline"
      className={
        status === "responded"
          ? "border-success/30 bg-success/10 text-success"
          : "border-warning/30 bg-warning/10 text-warning"
      }
    >
      {satisfactionSurveySubmissionStatusLabels[status]}
    </Badge>
  );
};

const PesquisaAvaliacao = () => {
  const navigate = useNavigate();
  const { data: submissions = [], error, isLoading } = useTenantSatisfactionSurveySubmissions();
  const [search, setSearch] = useState("");

  const filteredSubmissions = useMemo(
    () => submissions.filter((item) => matchesSearch(item, search)),
    [search, submissions],
  );

  const sentCount = useMemo(() => submissions.filter((item) => item.sentAt).length, [submissions]);
  const respondedCount = useMemo(
    () => submissions.filter((item) => item.respondedAt).length,
    [submissions],
  );
  const pendingCount = useMemo(
    () => submissions.filter((item) => item.sentAt && !item.respondedAt).length,
    [submissions],
  );

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pesquisa de avaliação</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Envios e respostas da pesquisa pós-festa por cliente.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Respondidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{respondedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <CardTitle className="text-base font-semibold">Pesquisas por cliente</CardTitle>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por cliente, aniversariante ou pacote..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Carregando pesquisas...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível carregar as pesquisas. Tente novamente em instantes.
            </div>
          )}

          {!isLoading && !error && filteredSubmissions.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Star className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <p className="font-medium text-foreground">Nenhuma pesquisa encontrada</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {submissions.length === 0
                    ? "Quando a pesquisa for enviada a um cliente, ela aparecerá aqui."
                    : "Ajuste a busca para encontrar pesquisas."}
                </p>
              </div>
              {submissions.length === 0 && (
                <Button asChild variant="outline">
                  <Link to="/configuracoes/pesquisa-avaliacao">Configurar pesquisa</Link>
                </Button>
              )}
            </div>
          )}

          {!isLoading && !error && filteredSubmissions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente / Festa</TableHead>
                  <TableHead>Data da festa</TableHead>
                  <TableHead>Enviada em</TableHead>
                  <TableHead>Respondida em</TableHead>
                  <TableHead>Item avaliação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((item) => (
                  <TableRow key={item.eventoId}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={() => navigate(`/pesquisa-avaliacao/${item.eventoId}`)}
                        >
                          {item.clienteNome}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {item.aniversarianteNome ?? "Aniversariante não informado"}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.pacoteNome ?? "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.dataEvento)}</TableCell>
                    <TableCell>{formatDateTime(item.sentAt)}</TableCell>
                    <TableCell>{formatDateTime(item.respondedAt)}</TableCell>
                    <TableCell>
                      {item.avaliacaoNota ? (
                        <span className="font-semibold tabular-nums">{item.avaliacaoNota}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge item={item} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações da pesquisa">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/pesquisa-avaliacao/${item.eventoId}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver respostas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/crm/evento/${item.eventoId}`)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir evento
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default PesquisaAvaliacao;
