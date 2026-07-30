import { useEffect, useState } from "react";
import { GripVertical, Pencil } from "lucide-react";

import { ContactAvatar } from "@/components/admin/ContactAvatar";
import { PlatformWhatsappLeadEditDialog } from "@/components/admin/PlatformWhatsappLeadEditDialog";
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
import { formatDateBR } from "@/lib/date";
import { formatBrazilPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

const initialsFromName = (name: string | null, phone: string) => {
  const source = name?.trim() || phone;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

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
  const [editingConversation, setEditingConversation] = useState<PlatformWhatsappConversation | null>(
    null,
  );

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

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PLATFORM_WHATSAPP_STAGES.map((stage) => {
          const stageConversations = localConversations
            .filter((conversation) => conversation.stage === stage)
            .sort((a, b) => {
              if (a.is_unread !== b.is_unread) return a.is_unread ? -1 : 1;
              const aTime = a.last_message_at ? Date.parse(a.last_message_at) : 0;
              const bTime = b.last_message_at ? Date.parse(b.last_message_at) : 0;
              return bTime - aTime;
            });

          const unreadInStage = stageConversations.filter((conversation) => conversation.is_unread).length;

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
                {unreadInStage > 0 ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {unreadInStage} nova{unreadInStage === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <div className="min-h-[240px] space-y-2 rounded-xl border border-border/30 bg-muted/20 p-2">
                {stageConversations.map((conversation) => {
                  const displayPhone = formatBrazilPhone(conversation.customer_phone);

                  return (
                    <div
                      className={cn(
                        "cursor-grab rounded-xl border bg-white/90 p-3 shadow-sm transition-all active:cursor-grabbing hover:border-primary/30",
                        conversation.is_unread && "border-emerald-400/70 bg-emerald-50/50",
                        draggedId === conversation.id && "scale-95 opacity-50",
                        isUpdating && "pointer-events-none opacity-70",
                      )}
                      draggable={!isUpdating}
                      key={conversation.id}
                      onClick={() => onOpenDetail(conversation)}
                      onDragStart={() => setDraggedId(conversation.id)}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <ContactAvatar
                            avatarUrl={conversation.avatar_url}
                            className="mt-0.5"
                            initials={initialsFromName(
                              conversation.customer_name,
                              conversation.customer_phone,
                            )}
                            name={
                              conversation.customer_name?.trim() ||
                              displayPhone ||
                              conversation.customer_phone
                            }
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {conversation.is_unread ? (
                                <span
                                  aria-hidden
                                  className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                                  title="Não lida"
                                />
                              ) : null}
                              <p
                                className={cn(
                                  "truncate text-sm text-foreground",
                                  conversation.is_unread ? "font-bold" : "font-semibold",
                                )}
                              >
                                {conversation.customer_name?.trim() ||
                                  displayPhone ||
                                  conversation.customer_phone}
                              </p>
                            </div>
                            {conversation.customer_name?.trim() ? (
                              <p
                                className={cn(
                                  "truncate text-xs",
                                  conversation.is_unread
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {displayPhone}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {conversation.is_unread ? (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                              Nova
                            </span>
                          ) : null}
                          <Button
                            aria-label="Editar lead"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingConversation(conversation);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                      </div>

                      {conversation.last_message_preview ? (
                        <p
                          className={cn(
                            "mb-2 line-clamp-2 text-xs",
                            conversation.is_unread
                              ? "font-medium text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {conversation.last_message_preview}
                        </p>
                      ) : null}

                      <span className="text-[11px] text-muted-foreground">
                        {conversation.last_message_at
                          ? formatDateBR(conversation.last_message_at)
                          : "—"}
                      </span>
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

      <PlatformWhatsappLeadEditDialog
        conversation={editingConversation}
        open={editingConversation != null}
        onOpenChange={(open) => {
          if (!open) setEditingConversation(null);
        }}
        onSaved={(updated) => {
          setLocalConversations((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
          setEditingConversation(null);
        }}
      />
    </>
  );
};
