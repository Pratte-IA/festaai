import { useEffect, useState } from "react";
import { Check, Copy, GripVertical, MessageCircle, Phone } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PLATFORM_WHATSAPP_STAGES,
  PLATFORM_WHATSAPP_STAGE_LABELS,
  type PlatformWhatsappConversation,
  type PlatformWhatsappStage,
} from "@/features/platform-whatsapp";
import { toast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/date";
import { formatBrazilPhone, toWhatsAppMePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface PlatformWhatsappKanbanBoardProps {
  conversations: PlatformWhatsappConversation[];
  isUpdating?: boolean;
  onOpenDetail: (conversation: PlatformWhatsappConversation) => void;
  onStageChange: (
    conversationId: number,
    stage: PlatformWhatsappStage,
    extras?: { lostReason?: string },
  ) => Promise<void> | void;
}

interface PendingLost {
  conversationId: number;
  previousStage: PlatformWhatsappStage;
}

const buildWhatsappUrl = (phone: string) => {
  const mePhone = toWhatsAppMePhone(phone);
  return mePhone ? `https://wa.me/${mePhone}` : null;
};

export const PlatformWhatsappKanbanBoard = ({
  conversations,
  isUpdating,
  onOpenDetail,
  onStageChange,
}: PlatformWhatsappKanbanBoardProps) => {
  const [localConversations, setLocalConversations] = useState(conversations);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [pendingLost, setPendingLost] = useState<PendingLost | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const applyOptimisticStage = (
    conversationId: number,
    stage: PlatformWhatsappStage,
    previousStage: PlatformWhatsappStage,
    extras?: { lostReason?: string },
  ) => {
    setLocalConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lost_reason: stage === "perdido" ? extras?.lostReason ?? null : null,
              stage,
            }
          : conversation,
      ),
    );

    void Promise.resolve(onStageChange(conversationId, stage, extras)).catch(() => {
      setLocalConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, stage: previousStage }
            : conversation,
        ),
      );
    });
  };

  const handleDrop = (stage: PlatformWhatsappStage) => {
    if (draggedId == null) return;

    const dragged = localConversations.find((conversation) => conversation.id === draggedId);
    setDraggedId(null);

    if (!dragged || dragged.stage === stage) return;

    if (stage === "perdido") {
      setPendingLost({ conversationId: dragged.id, previousStage: dragged.stage });
      setLostReason("");
      return;
    }

    applyOptimisticStage(dragged.id, stage, dragged.stage);
  };

  const confirmLost = () => {
    if (!pendingLost) return;

    const { conversationId, previousStage } = pendingLost;
    const reason = lostReason.trim() || undefined;

    setPendingLost(null);
    setLostReason("");
    applyOptimisticStage(conversationId, "perdido", previousStage, { lostReason: reason });
  };

  const handleCopyPhone = async (event: React.MouseEvent, conversationId: number, phone: string) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(formatBrazilPhone(phone) || phone);
      setCopiedId(conversationId);
      toast({ title: "Telefone copiado" });
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PLATFORM_WHATSAPP_STAGES.map((stage) => {
          const stageConversations = localConversations.filter(
            (conversation) => conversation.stage === stage,
          );

          return (
            <div
              className="w-80 flex-shrink-0"
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(stage)}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold">{PLATFORM_WHATSAPP_STAGE_LABELS[stage]}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {stageConversations.length}
                </span>
              </div>

              <div className="min-h-[240px] space-y-2 rounded-xl border border-border/30 bg-muted/20 p-2">
                {stageConversations.map((conversation) => {
                  const displayPhone = formatBrazilPhone(conversation.customer_phone);
                  const whatsappUrl = buildWhatsappUrl(conversation.customer_phone);

                  return (
                    <div
                      className={cn(
                        "cursor-grab rounded-xl border bg-white/90 p-3 shadow-sm transition-all active:cursor-grabbing hover:border-primary/30",
                        draggedId === conversation.id && "scale-95 opacity-50",
                        isUpdating && "pointer-events-none opacity-70",
                      )}
                      draggable={!isUpdating}
                      key={conversation.id}
                      onClick={() => onOpenDetail(conversation)}
                      onDragStart={() => setDraggedId(conversation.id)}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {conversation.customer_name?.trim() || displayPhone || conversation.customer_phone}
                          </p>
                          {conversation.customer_name?.trim() ? (
                            <p className="truncate text-xs text-muted-foreground">{displayPhone}</p>
                          ) : null}
                        </div>
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                      </div>

                      {conversation.last_message_preview ? (
                        <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                          {conversation.last_message_preview}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {conversation.last_message_at
                            ? formatDateBR(conversation.last_message_at)
                            : "—"}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            className="h-7 w-7"
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={(event) =>
                              void handleCopyPhone(event, conversation.id, conversation.customer_phone)
                            }
                          >
                            {copiedId === conversation.id ? (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          {whatsappUrl ? (
                            <Button
                              asChild
                              className="h-7 w-7"
                              size="icon"
                              type="button"
                              variant="ghost"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ) : (
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={Boolean(pendingLost)} onOpenChange={(open) => !open && setPendingLost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
            <AlertDialogDescription>
              Opcional: informe o motivo da perda. Você pode deixar em branco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="lost-reason">Motivo</Label>
            <Input
              id="lost-reason"
              placeholder="Ex.: sem resposta, preço, concorrente..."
              value={lostReason}
              onChange={(event) => setLostReason(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingLost(null);
                setLostReason("");
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLost}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
