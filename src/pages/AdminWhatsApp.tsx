import { useEffect, useState } from "react";
import { Kanban, Phone } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PlatformWhatsappChatView } from "@/components/admin/PlatformWhatsappChatView";
import { PlatformWhatsappKanbanBoard } from "@/components/admin/PlatformWhatsappKanbanBoard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMarkPlatformWhatsappConversationRead,
  usePlatformWhatsappConnections,
  usePlatformWhatsappConversations,
  useUpdatePlatformWhatsappConversationStage,
  type PlatformWhatsappConversation,
  type PlatformWhatsappDraft,
  type PlatformWhatsappStage,
} from "@/features/platform-whatsapp";
import { toast } from "@/hooks/use-toast";

interface WhatsappLocationState {
  openConversation?: PlatformWhatsappConversation;
  openDraft?: PlatformWhatsappDraft;
  radarCompanyId?: number;
}

const AdminWhatsApp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: connections = [], isLoading: isLoadingConnections } = usePlatformWhatsappConnections();
  const { data: conversations = [], error, isLoading } = usePlatformWhatsappConversations();
  const updateStage = useUpdatePlatformWhatsappConversationStage();
  const markRead = useMarkPlatformWhatsappConversationRead();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedOverride, setSelectedOverride] = useState<PlatformWhatsappConversation | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<PlatformWhatsappDraft | null>(null);
  const [radarCompanyId, setRadarCompanyId] = useState<number | null>(null);

  const platformConnection = connections[0] ?? null;
  const isConnected = platformConnection?.status === "connected";
  const unreadCount = conversations.filter((conversation) => conversation.is_unread).length;
  const selectedConversation =
    selectedId == null
      ? null
      : (conversations.find((conversation) => conversation.id === selectedId) ??
        (selectedOverride?.id === selectedId ? selectedOverride : null));
  const isChatOpen = selectedConversation != null || selectedDraft != null;

  useEffect(() => {
    const state = location.state as WhatsappLocationState | null;
    if (!state?.openConversation && !state?.openDraft) return;

    if (state.openConversation) {
      setSelectedDraft(null);
      setSelectedOverride(state.openConversation);
      setSelectedId(state.openConversation.id);
      setRadarCompanyId(state.radarCompanyId ?? null);
      if (state.openConversation.is_unread) {
        void markRead.mutateAsync(state.openConversation.id);
      }
    } else if (state.openDraft) {
      setSelectedId(null);
      setSelectedOverride(null);
      setSelectedDraft(state.openDraft);
      setRadarCompanyId(state.openDraft.radar_company_id ?? state.radarCompanyId ?? null);
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const handleOpenDetail = (conversation: PlatformWhatsappConversation) => {
    setSelectedDraft(null);
    setSelectedOverride(conversation);
    setSelectedId(conversation.id);
    setRadarCompanyId(null);
    if (conversation.is_unread) {
      void markRead.mutateAsync(conversation.id);
    }
  };

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

  if (isChatOpen) {
    return (
      <main className="px-4 pt-4 sm:px-6 lg:px-10">
        <PlatformWhatsappChatView
          conversation={selectedConversation}
          draft={selectedDraft}
          radarCompanyId={radarCompanyId}
          onBack={() => {
            setSelectedId(null);
            setSelectedOverride(null);
            setSelectedDraft(null);
            setRadarCompanyId(null);
          }}
          onConversationReady={(conversation) => {
            setSelectedDraft(null);
            setSelectedOverride(conversation);
            setSelectedId(conversation.id);
          }}
        />
      </main>
    );
  }

  return (
    <AdminPageShell
      description="Gerencie as conversas do WhatsApp FestaAI por etapa. Clique no card para abrir o chat, ou no lápis para editar nome e etapa."
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
                {!isLoading && unreadCount > 0 ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">{unreadCount} sem ler</Badge>
                ) : null}
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
                onOpenDetail={handleOpenDetail}
                onStageChange={handleStageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
};

export default AdminWhatsApp;
