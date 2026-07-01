import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ClipboardList,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Search,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { PublicFormLinkCard } from "@/components/formulario-contratacao/PublicFormLinkCard";
import { ContractStatusBadge } from "@/features/eventos/contracts/contract-status";
import type { TenantFormSubmissionListItem } from "@/features/eventos/form-submission-types";
import { useTenantFormSubmissions } from "@/features/eventos/use-tenant-form-submissions";
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

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
};

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

const matchesSearch = (item: TenantFormSubmissionListItem, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    item.clienteNome,
    item.aniversarianteNome,
    item.pacoteNome,
    item.contractNumber,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
};

const Formularios = () => {
  const navigate = useNavigate();
  const { data: submissions = [], error, isLoading } = useTenantFormSubmissions();
  const [search, setSearch] = useState("");

  const filteredSubmissions = useMemo(
    () => submissions.filter((item) => matchesSearch(item, search)),
    [search, submissions],
  );

  const signedCount = useMemo(
    () => submissions.filter((item) => item.fechamentoConfirmadoEm).length,
    [submissions],
  );

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formulários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Formulários de contratação preenchidos pelos clientes pelo link público.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <PublicFormLinkCard />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com contrato assinado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{signedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {submissions.filter((item) => item.contractStatus === "generated").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <CardTitle className="text-base font-semibold">Formulários recebidos</CardTitle>
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
              Carregando formulários...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível carregar os formulários. Tente novamente em instantes.
            </div>
          )}

          {!isLoading && !error && filteredSubmissions.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <p className="font-medium text-foreground">Nenhum formulário encontrado</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {submissions.length === 0
                    ? "Quando um cliente preencher o formulário público, ele aparecerá aqui."
                    : "Ajuste a busca para encontrar formulários."}
                </p>
              </div>
              {submissions.length === 0 && (
                <Button asChild variant="outline">
                  <Link to="/configuracoes/formulario-contratacao">Configurar formulário</Link>
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
                  <TableHead>Valor</TableHead>
                  <TableHead>Recebido em</TableHead>
                  <TableHead>Contrato</TableHead>
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
                          onClick={() => navigate(`/formularios/${item.eventoId}`)}
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
                    <TableCell>{formatCurrency(item.valorTotal)}</TableCell>
                    <TableCell>{formatDateTime(item.submittedAt)}</TableCell>
                    <TableCell>
                      {item.contractId ? (
                        <div className="space-y-1">
                          <p className="text-sm">{item.contractNumber ?? "—"}</p>
                          {item.contractStatus && <ContractStatusBadge status={item.contractStatus} />}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações do formulário">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/formularios/${item.eventoId}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver respostas
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/crm/evento/${item.eventoId}`)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir evento
                          </DropdownMenuItem>
                          {item.contractId && (
                            <DropdownMenuItem onClick={() => navigate(`/contratos/${item.contractId}`)}>
                              <ArrowUpRight className="mr-2 h-4 w-4" />
                              Abrir contrato
                            </DropdownMenuItem>
                          )}
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

export default Formularios;
