import { useMemo } from "react";
import { Kanban } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CrmKanbanBoard, type CrmStatusChangeExtras } from "@/components/admin/crm/CrmKanbanBoard";
import { Card, CardContent } from "@/components/ui/card";
import {
  createDefaultKanbanFilters,
  useRadarKanbanBoard,
  useUpsertRadarCrm,
  type CrmStatus,
} from "@/features/radar-crm";
import { toast } from "@/hooks/use-toast";

const AdminCrm = () => {
  const navigate = useNavigate();
  const filters = useMemo(() => createDefaultKanbanFilters(), []);

  const { data: boardResult, error, isLoading } = useRadarKanbanBoard(filters);
  const upsertCrm = useUpsertRadarCrm();

  const companies = boardResult?.items ?? [];
  const total = boardResult?.total ?? 0;
  const counts = boardResult?.counts;

  const handleOpenDetail = (companyId: number) => {
    navigate(`/admin/crm/${companyId}`);
  };

  const handleStatusChange = async (
    companyId: number,
    status: CrmStatus,
    extras?: CrmStatusChangeExtras,
  ) => {
    try {
      await upsertCrm.mutateAsync({
        companyId,
        status,
        lostReason: status === "lost" ? extras?.lostReason : undefined,
        nextActionAt: status === "demo_scheduled" ? extras?.nextActionAt : undefined,
        nextActionDescription: status === "demo_scheduled" ? extras?.nextActionDescription : undefined,
      });
      toast({ title: "Status atualizado" });
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
      throw new Error("status update failed");
    }
  };

  return (
    <AdminPageShell
      description="Acompanhe o avanço das oportunidades encontradas pelo Radar. Use Consultar Leads no Radar Comercial para filtrar a base."
      title="CRM Comercial"
    >
      <Card className="rounded-2xl border-white/80 bg-white/90">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Kanban className="h-4 w-4 text-primary" />
            <span>{isLoading ? "Carregando..." : `${total} oportunidades no funil`}</span>
          </div>

          {error ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar o funil comercial.
              {error instanceof Error && error.message ? (
                <span className="mt-1 block text-xs opacity-80">{error.message}</span>
              ) : null}
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando funil...</p>
          ) : (
            <CrmKanbanBoard
              companies={companies}
              counts={counts}
              isUpdating={upsertCrm.isPending}
              onOpenDetail={handleOpenDetail}
              onStatusChange={handleStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
};

export default AdminCrm;
