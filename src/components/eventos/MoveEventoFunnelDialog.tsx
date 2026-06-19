import { useEffect, useMemo, useState } from "react";

import {
  Evento,
  FunnelType,
  funnelTabs,
  getDefaultStageForFunnel,
  stageMap,
  Stage,
  useUpdateEvento,
} from "@/features/eventos";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface MoveEventoFunnelDialogProps {
  evento: Evento;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
}

export const MoveEventoFunnelDialog = ({
  evento,
  onOpenChange,
  onSuccess,
  open,
}: MoveEventoFunnelDialogProps) => {
  const updateEvento = useUpdateEvento();
  const [targetFunnel, setTargetFunnel] = useState<FunnelType>(evento.funil);
  const [targetStage, setTargetStage] = useState<Stage>(evento.etapa);

  const stages = useMemo(() => stageMap[targetFunnel], [targetFunnel]);
  const currentFunnelLabel = funnelTabs.find((tab) => tab.key === evento.funil)?.label ?? evento.funil;

  useEffect(() => {
    if (!open) return;

    setTargetFunnel(evento.funil);
    setTargetStage(evento.etapa);
  }, [evento.etapa, evento.funil, open]);

  const handleFunnelChange = (funil: FunnelType) => {
    setTargetFunnel(funil);
    setTargetStage(getDefaultStageForFunnel(funil));
  };

  const handleSubmit = async () => {
    const hasChanges = targetFunnel !== evento.funil || targetStage !== evento.etapa;

    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    try {
      await updateEvento.mutateAsync({
        eventoId: evento.id,
        values: {
          etapa: targetStage,
          funil: targetFunnel,
        },
      });

      toast({
        title: "Funil atualizado",
        description: "O lead foi movido para o funil selecionado.",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: "Nao foi possivel mover o lead",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover para outro funil</DialogTitle>
          <DialogDescription>
            Lead de <span className="font-medium text-foreground">{evento.cliente_nome}</span>. Funil
            atual: {currentFunnelLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="move-funnel">Funil de destino</Label>
            <Select value={targetFunnel} onValueChange={(value) => handleFunnelChange(value as FunnelType)}>
              <SelectTrigger id="move-funnel">
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {funnelTabs.map((tab) => (
                  <SelectItem key={tab.key} value={tab.key}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="move-stage">Etapa no funil</Label>
            <Select value={targetStage} onValueChange={(value) => setTargetStage(value as Stage)}>
              <SelectTrigger id="move-stage">
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.key} value={stage.key}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={updateEvento.isPending} onClick={() => void handleSubmit()} type="button">
            {updateEvento.isPending ? "Salvando..." : "Mover lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
