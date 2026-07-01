import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, FileText, Search } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { ContractModuleGate } from "@/components/contracts/ContractModuleGate";
import { ContractStatusBadge } from "@/features/eventos/contracts/contract-status";
import { formatContractHashShort } from "@/features/eventos/contracts/contract-hash";
import type {
  ContractStatusFilter,
  TenantContractListItem,
} from "@/features/eventos/contracts/contract-list-types";
import { useTenantContracts } from "@/features/eventos/use-tenant-contracts";
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

  const filteredContracts = useMemo(
    () =>
      contracts.filter((item) => {
        if (!matchesSearch(item, search)) return false;
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        return true;
      }),
    [contracts, search, statusFilter],
  );

  return (
    <AppLayout>
      <ContractModuleGate>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico dos documentos gerados a partir dos eventos e formulários de fechamento.
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-4 pb-4">
            <CardTitle className="text-base font-semibold">Documentos</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por cliente, aniversariante ou número..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ContractStatusFilter)}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Carregando documentos...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Não foi possível carregar o histórico. Tente novamente em instantes.
              </div>
            )}

            {!isLoading && !error && filteredContracts.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/60" />
                <div>
                  <p className="font-medium text-foreground">Nenhum documento encontrado</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {contracts.length === 0
                      ? "Os contratos aparecem aqui quando forem gerados a partir de um evento ou formulário de fechamento."
                      : "Ajuste os filtros ou a busca para encontrar documentos."}
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
                    <TableHead>Documento</TableHead>
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/contratos/${item.id}`)}
                          >
                            Abrir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/crm/evento/${item.eventoId}`)}
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Evento
                          </Button>
                        </div>
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
