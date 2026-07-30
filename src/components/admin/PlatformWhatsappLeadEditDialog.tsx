import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLATFORM_WHATSAPP_STAGES,
  PLATFORM_WHATSAPP_STAGE_LABELS,
  useUpdatePlatformWhatsappConversation,
  type PlatformWhatsappConversation,
  type PlatformWhatsappStage,
} from "@/features/platform-whatsapp";
import { toast } from "@/hooks/use-toast";
import { formatBrazilPhone } from "@/lib/phone";

interface PlatformWhatsappLeadEditDialogProps {
  conversation: PlatformWhatsappConversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (conversation: PlatformWhatsappConversation) => void;
}

export const PlatformWhatsappLeadEditDialog = ({
  conversation,
  open,
  onOpenChange,
  onSaved,
}: PlatformWhatsappLeadEditDialogProps) => {
  const updateConversation = useUpdatePlatformWhatsappConversation();
  const [customerName, setCustomerName] = useState("");
  const [stage, setStage] = useState<PlatformWhatsappStage>("contato_inicial");
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    if (!conversation || !open) return;
    setCustomerName(conversation.customer_name ?? "");
    setStage(conversation.stage);
    setLostReason(conversation.lost_reason ?? "");
  }, [conversation, open]);

  const handleSave = async () => {
    if (!conversation) return;

    try {
      const updated = await updateConversation.mutateAsync({
        conversationId: conversation.id,
        customerName,
        lostReason: stage === "perdido" ? lostReason : null,
        stage,
      });
      toast({ title: "Lead atualizado" });
      onSaved?.(updated);
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao salvar lead", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lead</DialogTitle>
          <DialogDescription>
            Atualize o nome e a etapa do contato no funil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="lead-phone">Telefone</Label>
            <Input
              disabled
              id="lead-phone"
              value={
                conversation
                  ? formatBrazilPhone(conversation.customer_phone) || conversation.customer_phone
                  : ""
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-name">Nome</Label>
            <Input
              id="lead-name"
              placeholder="Nome do contato"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-stage">Etapa</Label>
            <Select value={stage} onValueChange={(value) => setStage(value as PlatformWhatsappStage)}>
              <SelectTrigger id="lead-stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_WHATSAPP_STAGES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {PLATFORM_WHATSAPP_STAGE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stage === "perdido" ? (
            <div className="space-y-2">
              <Label htmlFor="lead-lost-reason">Motivo (opcional)</Label>
              <Input
                id="lead-lost-reason"
                placeholder="Ex.: sem resposta, preço, concorrente..."
                value={lostReason}
                onChange={(event) => setLostReason(event.target.value)}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={updateConversation.isPending || !conversation} type="button" onClick={() => void handleSave()}>
            {updateConversation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
