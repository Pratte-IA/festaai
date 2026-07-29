import { useState } from "react";
import { ExternalLink, Kanban, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PlatformWhatsappKanbanBoard } from "@/components/admin/PlatformWhatsappKanbanBoard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  PLATFORM_WHATSAPP_STAGE_LABELS,
  usePlatformWhatsappConnections,
  usePlatformWhatsappConversations,
  useUpdatePlatformWhatsappConversationStage,
  type PlatformWhatsappConversation,
  type PlatformWhatsappStage,
} from "@/features/platform-whatsapp";
import { toast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/date";
import { formatBrazilPhone, toWhatsAppMePhone } from "@/lib/phone";

const AdminWhatsApp = () => {
  const { data: connections = [], isLoading: isLoadingConnections } = usePlatformWhatsappConnections();
  const { data: conversations = [], error, isLoading } = usePlatformWhatsappConversations();
  const updateStage = useUpdatePlatformWhatsappConversationStage();
  const [selected, setSelected] = useState<PlatformWhatsappConversation | null>(null);

  const platformConnection = connections[0] ?? null;
  const isConnected = platformConnection?.status === "connected";

  const handleStageChange = async (
    conversationId: number,
    stage: PlatformWhatsappStage,
    extras?: { lostReason?: string },
  ) => {
    try {
      await updateStage.mutateAsync({
        conversationId,
        lostReason: extras?.lostReason,
        stage,
      });
      toast({ title: "Etapa atualizada" });
    } catch {
      toast({ title: "Erro ao atualizar etapa", variant: "destructive" });
      throw new Error("stage update failed");
    }
  };

  const selectedWhatsappUrl = selected
    ? (() => {
        const mePhone = toWhatsAppMePhone(selected.customer_phone);
        return mePhone ? `https://wa.me/${mePhone}` : null;
      })()
    : null;

  return (
    <AdminPageShell
      description="Gerencie as conversas do WhatsApp FestaAI por etapa. Cada card é uma conversa ativa no número da plataforma."
      title="WhatsApp"
    >
      <div className="space-y-4">
        {!isLoadingConnections && !platformConnection ? (
          <Card className="rounded-2xl border-amber-200/80 bg-amber-50/80">
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-950">
                Conecte o número do FestaAI em Conexões para começar a receber conversas neste funil.
              </p>
              <Button asChild className="shrink-0" variant="outline">
                <Link to="/admin/conexoes">Ir para Conexões</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {platformConnection && !isConnected ? (
          <Card className="rounded-2xl border-amber-200/80 bg-amber-50/80">
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-950">
                A conexão da plataforma está{" "}
                <span className="font-medium">{platformConnection.status}</span>. Escaneie o QR Code em
                Conexões para ativar.
              </p>
              <Button asChild className="shrink-0" variant="outline">
                <Link to="/admin/conexoes">Abrir Conexões</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl border-white/80 bg-white/90">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Kanban className="h-4 w-4 text-primary" />
                <span>
                  {isLoading
                    ? "Carregando..."
                    : `${conversations.length} conversa${conversations.length === 1 ? "" : "s"} no funil`}
                </span>
              </div>
              {platformConnection?.phone ? (
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  <Phone className="h-3 w-3" />
                  {platformConnection.phone}
                </Badge>
              ) : null}
            </div>

            {error ? (
              <p className="text-sm text-destructive">
                Não foi possível carregar as conversas.
                {error instanceof Error && error.message ? (
                  <span className="mt-1 block text-xs opacity-80">{error.message}</span>
                ) : null}
              </p>
            ) : isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando funil...</p>
            ) : (
              <PlatformWhatsappKanbanBoard
                conversations={conversations}
                isUpdating={updateStage.isPending}
                onOpenDetail={setSelected}
                onStageChange={handleStageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selected?.customer_name?.trim() ||
                (selected ? formatBrazilPhone(selected.customer_phone) : "Conversa")}
            </SheetTitle>
            <SheetDescription>Detalhes da conversa WhatsApp (MVP sem inbox).</SheetDescription>
          </SheetHeader>

          {selected ? (
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Telefone</p>
                <p className="text-sm font-medium">{formatBrazilPhone(selected.customer_phone)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Etapa</p>
                <Badge variant="outline">{PLATFORM_WHATSAPP_STAGE_LABELS[selected.stage]}</Badge>
              </div>

              {selected.last_message_preview ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Última mensagem
                  </p>
                  <p className="rounded-lg border bg-muted/30 p-3 text-sm text-foreground">
                    {selected.last_message_preview}
                  </p>
                  {selected.last_message_at ? (
                    <p className="text-xs text-muted-foreground">{formatDateBR(selected.last_message_at)}</p>
                  ) : null}
                </div>
              ) : null}

              {selected.stage === "perdido" && selected.lost_reason ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Motivo da perda
                  </p>
                  <p className="text-sm">{selected.lost_reason}</p>
                </div>
              ) : null}

              {selectedWhatsappUrl ? (
                <Button asChild className="w-full gap-2">
                  <a href={selectedWhatsappUrl} rel="noopener noreferrer" target="_blank">
                    <MessageCircle className="h-4 w-4" />
                    Abrir no WhatsApp
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  );
};

export default AdminWhatsApp;
