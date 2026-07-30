import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Paperclip, Pencil, SendHorizontal, X } from "lucide-react";

import { ContactAvatar } from "@/components/admin/ContactAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  usePlatformWhatsappMessages,
  useRefreshPlatformWhatsappAvatar,
  useSendPlatformWhatsappMessage,
  useUpdatePlatformWhatsappConversation,
  type PlatformWhatsappConversation,
  type PlatformWhatsappDraft,
  type PlatformWhatsappMessage,
  type PlatformWhatsappStage,
} from "@/features/platform-whatsapp";
import { toast } from "@/hooks/use-toast";
import { formatBrazilPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface PlatformWhatsappChatViewProps {
  conversation?: PlatformWhatsappConversation | null;
  draft?: PlatformWhatsappDraft | null;
  radarCompanyId?: number | null;
  onBack: () => void;
  onConversationReady?: (conversation: PlatformWhatsappConversation) => void;
}

const initialsFromName = (name: string | null, phone: string) => {
  const source = name?.trim() || phone;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatDayLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hoje";
  if (sameDay(date, yesterday)) return "Ontem";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const dayKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

interface MessageGroup {
  day: string;
  label: string;
  messages: PlatformWhatsappMessage[];
}

const groupMessagesByDay = (messages: PlatformWhatsappMessage[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const key = dayKey(message.sent_at);
    const last = groups[groups.length - 1];
    if (last && last.day === key) {
      last.messages.push(message);
    } else {
      groups.push({
        day: key,
        label: formatDayLabel(message.sent_at),
        messages: [message],
      });
    }
  }

  return groups;
};

export const PlatformWhatsappChatView = ({
  conversation: conversationProp = null,
  draft: draftContact = null,
  radarCompanyId = null,
  onBack,
  onConversationReady,
}: PlatformWhatsappChatViewProps) => {
  const [conversation, setConversation] = useState<PlatformWhatsappConversation | null>(
    conversationProp,
  );
  const [messageDraft, setMessageDraft] = useState("");
  const [stage, setStage] = useState<PlatformWhatsappStage>(
    conversationProp?.stage ?? "contato_inicial",
  );
  const [customerNameDraft, setCustomerNameDraft] = useState(
    conversationProp?.customer_name ?? draftContact?.customer_name ?? "",
  );
  const [lostReasonDraft, setLostReasonDraft] = useState(conversationProp?.lost_reason ?? "");
  const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const customerName = conversation?.customer_name ?? draftContact?.customer_name ?? null;
  const customerPhone = conversation?.customer_phone ?? draftContact?.customer_phone ?? "";
  const conversationId = conversation?.id ?? null;

  const { data: messages = [], isLoading } = usePlatformWhatsappMessages(conversationId);
  const sendMessage = useSendPlatformWhatsappMessage();
  const updateConversation = useUpdatePlatformWhatsappConversation();
  const refreshAvatar = useRefreshPlatformWhatsappAvatar();

  const displayName = customerName?.trim() || formatBrazilPhone(customerPhone);
  const displayPhone = formatBrazilPhone(customerPhone);
  const initials = initialsFromName(customerName, customerPhone);
  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);
  const isDraftChat = conversationId == null;

  useEffect(() => {
    setConversation(conversationProp);
  }, [conversationProp]);

  useEffect(() => {
    if (conversation?.stage) setStage(conversation.stage);
    setCustomerNameDraft(conversation?.customer_name ?? draftContact?.customer_name ?? "");
    setLostReasonDraft(conversation?.lost_reason ?? "");
  }, [conversation, draftContact?.customer_name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (conversationId == null) return;
    void refreshAvatar.mutateAsync({
      conversationId,
      force: !conversation?.avatar_url,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir/trocar conversa
  }, [conversationId]);

  useEffect(() => {
    if (!isContactPanelOpen) setIsEditingContact(false);
  }, [isContactPanelOpen]);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = messageDraft.trim();
    if (!text || sendMessage.isPending || !customerPhone) return;

    setMessageDraft("");
    try {
      const linkedCompanyId = radarCompanyId ?? draftContact?.radar_company_id ?? null;
      const result = await sendMessage.mutateAsync(
        conversationId != null
          ? { conversationId, radarCompanyId: linkedCompanyId, text }
          : {
              customerName,
              phone: customerPhone,
              radarCompanyId: linkedCompanyId,
              text,
            },
      );

      if (result.conversation) {
        setConversation(result.conversation);
        onConversationReady?.(result.conversation);
      } else if (conversationId == null) {
        // Fallback: pelo menos marca o id pela mensagem criada
        const createdId = result.message.conversation_id;
        setConversation({
          avatar_fetched_at: null,
          avatar_url: null,
          connection_id: draftContact?.connection_id ?? 0,
          created_at: new Date().toISOString(),
          customer_name: customerName,
          customer_phone: customerPhone,
          id: createdId,
          is_unread: false,
          last_message_at: result.message.sent_at,
          last_message_preview: text,
          lost_reason: null,
          stage: "contato_inicial",
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      setMessageDraft(text);
      toast({
        description: error instanceof Error ? error.message : "Tente novamente.",
        title: "Não foi possível enviar",
        variant: "destructive",
      });
    }
  };

  const handleStageChange = async (nextStage: PlatformWhatsappStage) => {
    if (conversationId == null) return;
    const previous = stage;
    setStage(nextStage);
    try {
      const updated = await updateConversation.mutateAsync({
        conversationId,
        lostReason: nextStage === "perdido" ? lostReasonDraft : null,
        stage: nextStage,
      });
      setConversation(updated);
      onConversationReady?.(updated);
      toast({ title: "Etapa atualizada" });
    } catch {
      setStage(previous);
      toast({ title: "Erro ao atualizar etapa", variant: "destructive" });
    }
  };

  const handleSaveContact = async () => {
    if (conversationId == null) return;

    try {
      const updated = await updateConversation.mutateAsync({
        conversationId,
        customerName: customerNameDraft,
        lostReason: stage === "perdido" ? lostReasonDraft : null,
        stage,
      });
      setConversation(updated);
      onConversationReady?.(updated);
      setIsEditingContact(false);
      toast({ title: "Lead atualizado" });
    } catch {
      toast({ title: "Erro ao salvar lead", variant: "destructive" });
    }
  };

  return (
    <div className="-mx-4 -mb-8 flex h-[calc(100vh-5.5rem)] min-h-[560px] flex-col overflow-hidden border-y border-border/40 bg-[#e5ddd5] sm:-mx-6 lg:-mx-10">
      <div className="flex min-h-0 flex-1">
        {/* Chat principal */}
        <section className="flex min-w-0 flex-1 flex-col bg-[#efeae2]">
          <header className="flex items-center gap-2 border-b border-black/5 bg-[#f0f2f5] px-2 py-2.5 sm:gap-3 sm:px-4">
            <Button
              className="h-9 w-9 shrink-0 text-[#54656f]"
              size="icon"
              type="button"
              variant="ghost"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button
              aria-expanded={isContactPanelOpen}
              aria-label="Abrir informações do contato"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-black/[0.04]"
              type="button"
              onClick={() => setIsContactPanelOpen((open) => !open)}
            >
              <ContactAvatar
                avatarUrl={conversation?.avatar_url}
                initials={initials}
                name={displayName}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111b21]">{displayName}</p>
                <p className="truncate text-xs text-[#667781]">
                  {isContactPanelOpen ? "Toque para fechar info" : displayPhone}
                </p>
              </div>
              <Badge className="hidden shrink-0 bg-[#25d366]/10 text-[#128c7e] hover:bg-[#25d366]/10 sm:inline-flex">
                {isDraftChat ? "Novo contato" : PLATFORM_WHATSAPP_STAGE_LABELS[stage]}
              </Badge>
            </button>
          </header>

          <div
            className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9b8a8' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          >
            {isLoading && !isDraftChat ? (
              <div className="flex h-full items-center justify-center text-sm text-[#667781]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando mensagens...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="rounded-lg bg-white/80 px-4 py-2 text-sm text-[#667781] shadow-sm">
                  {isDraftChat
                    ? "Envie a primeira mensagem para iniciar a conversa no funil."
                    : "Nenhuma mensagem salva ainda. Novas mensagens aparecerão aqui."}
                </p>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {groups.map((group) => (
                  <div className="space-y-2" key={group.day}>
                    <div className="flex justify-center py-2">
                      <span className="rounded-lg bg-white/90 px-3 py-1 text-[11px] font-medium text-[#54656f] shadow-sm">
                        {group.label}
                      </span>
                    </div>
                    {group.messages.map((message) => {
                      const outbound = message.from_me || message.direction === "outbound";
                      return (
                        <div
                          className={cn("flex", outbound ? "justify-end" : "justify-start")}
                          key={message.id}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-lg px-3 py-1.5 shadow-sm sm:max-w-[70%]",
                              outbound
                                ? "rounded-tr-none bg-[#d9fdd3] text-[#111b21]"
                                : "rounded-tl-none bg-white text-[#111b21]",
                            )}
                          >
                            {!outbound && customerName?.trim() ? (
                              <p className="mb-0.5 text-[11px] font-semibold text-[#128c7e]">
                                {customerName.trim().split(/\s+/)[0]}
                              </p>
                            ) : null}
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {message.body || "[Mensagem]"}
                            </p>
                            <p className="mt-0.5 text-right text-[10px] text-[#667781]">
                              {formatMessageTime(message.sent_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form
            className="border-t border-black/5 bg-[#f0f2f5] px-2 py-2 sm:px-3"
            onSubmit={(event) => void handleSend(event)}
          >
            <div className="flex items-end gap-2">
              <button
                aria-label="Anexar (em breve)"
                className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#54656f] opacity-40"
                disabled
                type="button"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1 rounded-3xl bg-white px-4 py-2 shadow-sm">
                <textarea
                  className="max-h-32 min-h-[24px] w-full resize-none bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
              </div>
              <Button
                className="mb-0.5 h-10 w-10 shrink-0 rounded-full bg-[#00a884] hover:bg-[#008f72]"
                disabled={!messageDraft.trim() || sendMessage.isPending}
                size="icon"
                type="submit"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* Painel de info — só abre ao clicar no header */}
        {isContactPanelOpen ? (
          <>
            <button
              aria-label="Fechar informações do contato"
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              type="button"
              onClick={() => setIsContactPanelOpen(false)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col border-l border-black/5 bg-white shadow-xl lg:static lg:z-auto lg:w-72 lg:shadow-none xl:w-80">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <p className="text-sm font-semibold text-[#111b21]">Dados do contato</p>
                <div className="flex items-center gap-1">
                  {!isDraftChat ? (
                    <Button
                      aria-label={isEditingContact ? "Cancelar edição" : "Editar lead"}
                      className="h-8 w-8 text-[#54656f]"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (isEditingContact) {
                          setCustomerNameDraft(conversation?.customer_name ?? "");
                          setStage(conversation?.stage ?? "contato_inicial");
                          setLostReasonDraft(conversation?.lost_reason ?? "");
                          setIsEditingContact(false);
                          return;
                        }
                        setIsEditingContact(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    className="h-8 w-8 text-[#54656f]"
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() => setIsContactPanelOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 border-b border-border/50 px-6 py-8">
                <ContactAvatar
                  avatarUrl={conversation?.avatar_url}
                  initials={initials}
                  name={displayName}
                  size="lg"
                />
                <div className="text-center">
                  <p className="text-base font-semibold text-[#111b21]">{displayName}</p>
                  <p className="text-sm text-[#667781]">{displayPhone}</p>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                {isEditingContact ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="chat-lead-name">Nome</Label>
                      <Input
                        id="chat-lead-name"
                        placeholder="Nome do contato"
                        value={customerNameDraft}
                        onChange={(event) => setCustomerNameDraft(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chat-lead-stage">Etapa</Label>
                      <Select
                        value={stage}
                        onValueChange={(value) => setStage(value as PlatformWhatsappStage)}
                      >
                        <SelectTrigger id="chat-lead-stage">
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
                        <Label htmlFor="chat-lead-lost-reason">Motivo (opcional)</Label>
                        <Input
                          id="chat-lead-lost-reason"
                          placeholder="Ex.: sem resposta, preço..."
                          value={lostReasonDraft}
                          onChange={(event) => setLostReasonDraft(event.target.value)}
                        />
                      </div>
                    ) : null}

                    <Button
                      className="w-full"
                      disabled={updateConversation.isPending}
                      type="button"
                      onClick={() => void handleSaveContact()}
                    >
                      {updateConversation.isPending ? "Salvando..." : "Salvar alterações"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#667781]">
                        Etapa
                      </p>
                      {isDraftChat ? (
                        <p className="text-sm text-[#667781]">
                          Disponível após a primeira mensagem.
                        </p>
                      ) : (
                        <Select
                          value={stage}
                          onValueChange={(value) => void handleStageChange(value as PlatformWhatsappStage)}
                        >
                          <SelectTrigger>
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
                      )}
                    </div>

                    {conversation?.last_message_at ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#667781]">
                          Última atividade
                        </p>
                        <p className="text-sm text-[#111b21]">
                          {new Date(conversation.last_message_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ) : null}

                    <p className="text-xs leading-relaxed text-[#667781]">
                      Clique no lápis para editar o nome e a etapa. As mensagens sincronizam pelo
                      WhatsApp do FestaAI.
                    </p>
                  </>
                )}
              </div>
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
};
