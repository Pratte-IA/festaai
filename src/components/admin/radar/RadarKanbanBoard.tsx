import { useEffect, useState } from "react";
import {
  AlertTriangle,
  GripVertical,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";

import { RadarPriorityBadge } from "@/components/admin/radar/RadarPriorityBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CRM_KANBAN_STATUSES,
  CRM_STATUS_LABELS,
  buildWhatsappUrl,
  formatPhoneDisplay,
  type CrmStatus,
  type RadarCompanyListItem,
} from "@/features/radar-crm";
import { toast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/date";
import { cn } from "@/lib/utils";

interface RadarKanbanBoardProps {
  companies: RadarCompanyListItem[];
  isUpdating?: boolean;
  onOpenDetail: (companyId: number) => void;
  onStatusChange: (companyId: number, status: CrmStatus, lostReason?: string) => Promise<void> | void;
}

export const RadarKanbanBoard = ({
  companies,
  isUpdating,
  onOpenDetail,
  onStatusChange,
}: RadarKanbanBoardProps) => {
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [pendingLost, setPendingLost] = useState<{ companyId: number; previousStatus: CrmStatus } | null>(null);
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    setLocalCompanies(companies);
  }, [companies]);

  const visibleCompanies = localCompanies.filter((company) => !company.do_not_contact);

  const handleDragStart = (companyId: number) => {
    setDraggedId(companyId);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (stageStatus: CrmStatus) => {
    if (draggedId == null) return;

    const draggedCompany = localCompanies.find((company) => company.id === draggedId);
    setDraggedId(null);

    if (!draggedCompany || draggedCompany.status === stageStatus) return;

    if (stageStatus === "lost") {
      setPendingLost({ companyId: draggedCompany.id, previousStatus: draggedCompany.status });
      setLostReason("");
      return;
    }

    const previousStatus = draggedCompany.status;
    setLocalCompanies((current) =>
      current.map((company) =>
        company.id === draggedCompany.id ? { ...company, status: stageStatus } : company,
      ),
    );

    void Promise.resolve(onStatusChange(draggedCompany.id, stageStatus)).catch(() => {
      setLocalCompanies((current) =>
        current.map((company) =>
          company.id === draggedCompany.id ? { ...company, status: previousStatus } : company,
        ),
      );
    });
  };

  const confirmLost = () => {
    if (!pendingLost) return;
    const reason = lostReason.trim();
    if (!reason) {
      toast({ title: "Informe o motivo da perda", variant: "destructive" });
      return;
    }

    const { companyId, previousStatus } = pendingLost;
    setLocalCompanies((current) =>
      current.map((company) =>
        company.id === companyId ? { ...company, status: "lost" as CrmStatus } : company,
      ),
    );
    setPendingLost(null);
    setLostReason("");

    void Promise.resolve(onStatusChange(companyId, "lost", reason)).catch(() => {
      setLocalCompanies((current) =>
        current.map((company) =>
          company.id === companyId ? { ...company, status: previousStatus } : company,
        ),
      );
    });
  };

  const cancelLost = () => {
    setPendingLost(null);
    setLostReason("");
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {CRM_KANBAN_STATUSES.map((stageStatus) => {
          const stageCompanies = visibleCompanies.filter((company) => company.status === stageStatus);

          return (
            <div
              className="w-72 flex-shrink-0"
              id={`radar-kanban-${stageStatus}`}
              key={stageStatus}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stageStatus)}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold">{CRM_STATUS_LABELS[stageStatus]}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {stageCompanies.length}
                </span>
              </div>

              <div className="min-h-[200px] space-y-2 rounded-xl border border-border/30 bg-muted/20 p-2">
                {stageCompanies.map((company) => {
                  const phone = company.whatsapp ?? company.phone ?? company.phone_unformatted;
                  const whatsappUrl = buildWhatsappUrl(phone);
                  const dm = company.primary_decision_maker;

                  return (
                    <div
                      className={cn(
                        "cursor-grab rounded-xl border bg-white/90 p-3 shadow-sm transition-all active:cursor-grabbing hover:border-primary/30",
                        draggedId === company.id && "scale-95 opacity-50",
                        isUpdating && "pointer-events-none opacity-70",
                      )}
                      draggable={!isUpdating}
                      key={company.id}
                      onClick={() => onOpenDetail(company.id)}
                      onDragStart={() => handleDragStart(company.id)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="truncate text-sm font-bold">{company.trade_name ?? company.name}</p>

                          {(company.city || company.state) && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {[company.city, company.state].filter(Boolean).join(" / ")}
                            </p>
                          )}

                          {phone ? (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              {whatsappUrl ? (
                                <MessageCircle className="h-3 w-3 flex-shrink-0 text-emerald-600" />
                              ) : (
                                <Phone className="h-3 w-3 flex-shrink-0" />
                              )}
                              {formatPhoneDisplay(phone)}
                            </p>
                          ) : null}

                          {company.instagram_url ? (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Instagram className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">Instagram</span>
                            </p>
                          ) : null}

                          {dm ? (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <UserRound className="h-3 w-3 flex-shrink-0" />
                              {dm.name}
                            </p>
                          ) : null}

                          <RadarPriorityBadge priority={company.priority} />

                          {(company.next_action_at || company.next_action_description) && (
                            <p
                              className={cn(
                                "text-xs",
                                company.next_action_overdue
                                  ? "font-medium text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              {company.next_action_overdue ? (
                                <span className="mr-1 inline-flex items-center gap-0.5">
                                  <AlertTriangle className="h-3 w-3" />
                                  Atrasada
                                </span>
                              ) : null}
                              {company.next_action_at
                                ? formatDateBR(company.next_action_at)
                                : null}
                              {company.next_action_description
                                ? ` · ${company.next_action_description}`
                                : null}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {stageCompanies.length === 0 && (
                  <div className="flex h-24 items-center justify-center text-xs text-muted-foreground/50">
                    Arraste aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog onOpenChange={(open) => !open && cancelLost()} open={pendingLost !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da perda antes de mover o card para Perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(event) => setLostReason(event.target.value)}
            placeholder="Ex.: Sem budget / já tem fornecedor"
            value={lostReason}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLost}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLost}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
