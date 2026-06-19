import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { ContractModuleGate } from "@/components/contracts/ContractModuleGate";
import { ContractStatusBadge } from "@/features/eventos/contracts/contract-status";
import { formatContractHashShort } from "@/features/eventos/contracts/contract-hash";
import type {
  ContractAcceptedFilter,
  ContractStatusFilter,
  TenantContractListItem,
  TenantContractMetrics,
} from "@/features/eventos/contracts/contract-list-types";
import { useTenantContracts } from "@/features/eventos/use-tenant-contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const computeMetrics = (items: TenantContractListItem[]): TenantContractMetrics => ({
  accepted: items.filter((item) => item.status === "accepted").length,
  cancelledOrSuperseded: items.filter(
    (item) => item.status === "cancelled" || item.status === "superseded",
  ).length,
  pending: items.filter((item) => item.status === "generated").length,
  total: items.length,
});

const matchesSearch = (item: TenantContractListItem, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    item.contractNumber,
    item.evento?.clienteNome,
    item.evento?.aniversarianteNome,
    item.acceptedByName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
};

const Contratos = () => {
  const navigate = useNavigate();
  const { data: contracts = [], error, isLoading } = useTenantContracts();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>("all");
  const [acceptedFilter, setAcceptedFilter] = useState<ContractAcceptedFilter>("all");

  const metrics = useMemo(() => computeMetrics(contracts), [contracts]);

  const filteredContracts = useMemo(
    () =>
      contracts.filter((item) => {
        if (!matchesSearch(item, search)) return false;
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (acceptedFilter === "accepted" && item.status !== "accepted") return false;
        if (acceptedFilter === "pending" && item.status !== "generated") return false;
        return true;
      }),
    [acceptedFilter, contracts, search, statusFilter],
  );

  return (
    <AppLayout>
      <ContractModuleGate>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão de contratos gerados a partir dos eventos e formulários de fechamento.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando aceite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{metrics.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aceitos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{metrics.accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados / substituídos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.cancelledOrSuperseded}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <CardTitle className="text-base font-semibold">Contratos do espaço</CardTitle>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por cliente, aniversariante ou número..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContractStatusFilter)}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="generated">Aguardando aceite</SelectItem>
                <SelectItem value="accepted">Aceito</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="superseded">Substituído</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={acceptedFilter}
              onValueChange={(value) => setAcceptedFilter(value as ContractAcceptedFilter)}
            >
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Aceite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Aceite: todos</SelectItem>
                <SelectItem value="pending">Sem aceite</SelectItem>
                <SelectItem value="accepted">Com aceite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Carregando contratos...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível carregar os contratos. Tente novamente em instantes.
            </div>
          )}

          {!isLoading && !error && filteredContracts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/60" />
              <div>
                <p className="font-medium text-foreground">Nenhum contrato encontrado</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {contracts.length === 0
                    ? "Gere o primeiro contrato a partir de um evento com fechamento confirmado ou no funil Festa."
                    : "Ajuste os filtros ou a busca para encontrar contratos."}
                </p>
              </div>
              {contracts.length === 0 && (
                <Button asChild variant="outline">
                  <Link to="/crm">Ir para o CRM</Link>
                </Button>
              )}
            </div>
          )}

          {!isLoading && !error && filteredContracts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cliente / Festa</TableHead>
                  <TableHead>Data da festa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Geração</TableHead>
                  <TableHead>Aceite</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={() => navigate(`/contratos/${item.id}`)}
                        >
                          {item.contractNumber}
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                          <ContractStatusBadge status={item.status} />
                          <code className="text-[11px] text-muted-foreground">
                            {formatContractHashShort(item.contractHash)}
                          </code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{item.evento?.clienteNome ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.evento?.aniversarianteNome ?? "Aniversariante não informado"}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.evento?.pacoteNome ?? "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.evento?.dataEvento)}</TableCell>
                    <TableCell>{formatCurrency(item.evento?.valorTotal)}</TableCell>
                    <TableCell>{formatDateTime(item.generatedAt)}</TableCell>
                    <TableCell>
                      {item.status === "accepted" ? (
                        <div className="space-y-0.5">
                          <p className="text-sm">{formatDateTime(item.acceptedAt)}</p>
                          <p className="text-xs text-muted-foreground">{item.acceptedByName ?? "—"}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações do contrato">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/contratos/${item.id}`)}>
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Abrir contrato
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/crm/evento/${item.eventoId}`)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir evento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/contratos/${item.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar contrato
                          </DropdownMenuItem>
                          {item.status === "generated" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/contratos/${item.id}?acao=aceite`)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Registrar aceite
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/contratos/${item.id}?acao=regerar`)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Regerar contrato
                              </DropdownMenuItem>
                            </>
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
      </ContractModuleGate>
    </AppLayout>
  );
};

export default Contratos;
