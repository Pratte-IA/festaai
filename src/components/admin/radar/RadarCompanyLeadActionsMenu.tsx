import { useEffect, useState } from "react";
import { MoreVertical, Pencil } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  CRM_PRIORITIES,
  CRM_PRIORITY_LABELS,
  CRM_STATUSES,
  CRM_STATUS_LABELS,
  LOST_REASONS,
  useRadarCompanyDetail,
  useUpsertRadarCrm,
  type CrmPriority,
  type CrmStatus,
} from "@/features/radar-crm";
import { toast } from "@/hooks/use-toast";

interface RadarCompanyLeadActionsMenuProps {
  companyId: number;
  onEditInfo: () => void;
}

export const RadarCompanyLeadActionsMenu = ({
  companyId,
  onEditInfo,
}: RadarCompanyLeadActionsMenuProps) => {
  const { data } = useRadarCompanyDetail(companyId);
  const upsertCrm = useUpsertRadarCrm();

  const [status, setStatus] = useState<CrmStatus>("new_lead");
  const [priority, setPriority] = useState<CrmPriority>("medium");
  const [pendingLost, setPendingLost] = useState(false);
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    if (!data?.crm) return;
    setStatus(data.crm.status);
    setPriority(data.crm.priority);
  }, [data?.crm]);

  const applyStageChange = async (nextStatus: CrmStatus, reason?: string) => {
    const previous = status;
    setStatus(nextStatus);
    try {
      await upsertCrm.mutateAsync({
        companyId,
        status: nextStatus,
        lostReason:
          nextStatus === "lost" ? reason?.trim() || "Não informado" : null,
      });
      toast({ title: "Etapa atualizada" });
    } catch {
      setStatus(previous);
      toast({ title: "Erro ao mudar etapa", variant: "destructive" });
    }
  };

  const handleStageSelect = (nextStatus: string) => {
    const value = nextStatus as CrmStatus;
    if (value === status) return;
    if (value === "lost") {
      setPendingLost(true);
      setLostReason("");
      return;
    }
    void applyStageChange(value);
  };

  const handlePrioritySelect = async (nextPriority: string) => {
    const value = nextPriority as CrmPriority;
    if (value === priority) return;
    const previous = priority;
    setPriority(value);
    try {
      await upsertCrm.mutateAsync({ companyId, priority: value });
      toast({ title: "Prioridade atualizada" });
    } catch {
      setPriority(previous);
      toast({ title: "Erro ao atualizar prioridade", variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Ações do lead"
            className="h-9 w-9 shrink-0"
            size="icon"
            type="button"
            variant="outline"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ações do lead</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Etapa do funil</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuRadioGroup onValueChange={handleStageSelect} value={status}>
                {CRM_STATUSES.map((item) => (
                  <DropdownMenuRadioItem
                    disabled={upsertCrm.isPending}
                    key={item}
                    value={item}
                  >
                    {CRM_STATUS_LABELS[item]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Prioridade</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                onValueChange={(value) => void handlePrioritySelect(value)}
                value={priority}
              >
                {CRM_PRIORITIES.map((item) => (
                  <DropdownMenuRadioItem
                    disabled={upsertCrm.isPending}
                    key={item}
                    value={item}
                  >
                    {CRM_PRIORITY_LABELS[item]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              onEditInfo();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingLost(false);
            setLostReason("");
          }
        }}
        open={pendingLost}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o motivo da perda para mover este lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="lead-menu-lost-reason">Motivo</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              id="lead-menu-lost-reason"
              onChange={(event) => setLostReason(event.target.value)}
              value={lostReason}
            >
              <option value="">Selecione...</option>
              {LOST_REASONS.map((reason) => (
                <option key={reason.value} value={reason.label}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const reason = lostReason.trim() || "Não informado";
                setPendingLost(false);
                void applyStageChange("lost", reason);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
