import { useMemo, useState } from "react";
import { LayoutGrid, List, Radar, Search, X } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { RadarCompanyDetailSheet } from "@/components/admin/radar/RadarCompanyDetailSheet";
import { RadarCompanyTable } from "@/components/admin/radar/RadarCompanyTable";
import { RadarFilters } from "@/components/admin/radar/RadarFilters";
import { RadarKanbanBoard } from "@/components/admin/radar/RadarKanbanBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createDefaultRadarFilters,
  hasActiveRadarFilters,
  useRadarCompanyList,
  useRadarFilterOptions,
  useUpsertRadarCrm,
  type CrmPriority,
  type CrmStatus,
  type RadarCrmFilters,
} from "@/features/radar-crm";
import { toast } from "@/hooks/use-toast";

type ViewMode = "list" | "kanban";

const KANBAN_PAGE_SIZE = 100;

const AdminRadar = () => {
  const [filters, setFilters] = useState<RadarCrmFilters>(createDefaultRadarFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const listFilters = useMemo(
    () => ({
      ...filters,
      pageSize: viewMode === "kanban" ? KANBAN_PAGE_SIZE : filters.pageSize,
      page: viewMode === "kanban" ? 1 : filters.page,
    }),
    [filters, viewMode],
  );

  const { data: listResult, error, isLoading } = useRadarCompanyList(listFilters);
  const { data: filterOptions } = useRadarFilterOptions();
  const upsertCrm = useUpsertRadarCrm();

  const companies = listResult?.items ?? [];
  const total = listResult?.total ?? 0;
  const filtered = listResult?.filtered ?? 0;
  const totalPages = Math.max(1, Math.ceil(filtered / listFilters.pageSize));

  const handleFiltersChange = (patch: Partial<RadarCrmFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleClearFilters = () => {
    setFilters(createDefaultRadarFilters());
  };

  const handleOpenDetail = (companyId: number) => {
    setSelectedCompanyId(companyId);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedCompanyId(null);
  };

  const handleStatusChange = async (companyId: number, status: CrmStatus, lostReason?: string) => {
    try {
      await upsertCrm.mutateAsync({
        companyId,
        status,
        lostReason: status === "lost" ? lostReason : undefined,
        doNotContact: status === "do_not_contact" ? true : undefined,
      });
      toast({ title: "Status atualizado" });
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
      throw new Error("status update failed");
    }
  };

  const handlePriorityChange = async (companyId: number, priority: CrmPriority) => {
    try {
      await upsertCrm.mutateAsync({ companyId, priority });
      toast({ title: "Prioridade atualizada" });
    } catch {
      toast({ title: "Erro ao atualizar prioridade", variant: "destructive" });
    }
  };

  return (
    <AdminPageShell
      description="Empresas encontradas e qualificadas pelo motor de prospecção"
      title="Radar Comercial"
    >
      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radar className="h-4 w-4 text-primary" />
              <span>
                {isLoading ? "Carregando..." : `${filtered} de ${total} empresas`}
              </span>
              {hasActiveRadarFilters(filters) ? (
                <Button onClick={handleClearFilters} size="sm" type="button" variant="ghost">
                  <X className="mr-1 h-3.5 w-3.5" />
                  Limpar filtros
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => handleFiltersChange({ search: event.target.value, page: 1 })}
                  placeholder="Buscar empresa..."
                  value={filters.search}
                />
              </div>

              <div className="flex rounded-lg border p-1">
                <Button
                  className="gap-1.5"
                  onClick={() => setViewMode("list")}
                  size="sm"
                  type="button"
                  variant={viewMode === "list" ? "default" : "ghost"}
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
                <Button
                  className="gap-1.5"
                  onClick={() => setViewMode("kanban")}
                  size="sm"
                  type="button"
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </Button>
              </div>
            </div>
          </div>

          {filterOptions ? (
            <RadarFilters
              filters={filters}
              onChange={handleFiltersChange}
              onClear={handleClearFilters}
              options={filterOptions}
            />
          ) : null}

          {error ? (
            <p className="text-sm text-destructive">Não foi possível carregar as empresas.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando empresas...</p>
          ) : viewMode === "kanban" ? (
            <RadarKanbanBoard
              companies={companies}
              isUpdating={upsertCrm.isPending}
              onOpenDetail={handleOpenDetail}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <>
              <RadarCompanyTable
                companies={companies}
                isUpdating={upsertCrm.isPending}
                onOpenDetail={handleOpenDetail}
                onPriorityChange={(id, priority) => void handlePriorityChange(id, priority)}
                onStatusChange={(id, status, lostReason) => void handleStatusChange(id, status, lostReason)}
              />

              {filtered > filters.pageSize ? (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Página {filters.page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={filters.page <= 1}
                      onClick={() => handleFiltersChange({ page: filters.page - 1 })}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <Button
                      disabled={filters.page >= totalPages}
                      onClick={() => handleFiltersChange({ page: filters.page + 1 })}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <RadarCompanyDetailSheet
        companyId={selectedCompanyId}
        onClose={handleCloseDetail}
        open={detailOpen}
      />
    </AdminPageShell>
  );
};

export default AdminRadar;
