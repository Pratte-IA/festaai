import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import type {
  PlatformWhatsappConnection,
  PlatformWhatsappConversation,
  PlatformWhatsappDraft,
  PlatformWhatsappMessage,
  PlatformWhatsappStage,
} from "./types";

const connectionsQueryKey = ["platform-whatsapp-connections"] as const;
const conversationsQueryKey = ["platform-whatsapp-conversations"] as const;
const messagesQueryKey = (conversationId: number | null) =>
  ["platform-whatsapp-messages", conversationId] as const;

interface ConnectionsResponse {
  connections: PlatformWhatsappConnection[];
  ok: boolean;
}

interface ConnectionResponse {
  connection: PlatformWhatsappConnection;
  ok: boolean;
}

const invokeWhatsappFunction = async <T>(functionName: string, body: Record<string, unknown>) => {
  // Garante JWT de usuário fresco (evita enviar anon key / access_token expirado).
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session?.access_token) {
      throw new Error("Sessão expirada. Saia e entre novamente no admin.");
    }
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message || "Não foi possível validar a sessão.");
  }

  if (!session?.access_token) {
    throw new Error("Sessão expirada. Saia e entre novamente no admin.");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  // fetch direto: evita bug do supabase-js que pode sobrescrever Authorization com a anon key.
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Erro ${response.status} ao chamar ${functionName}.`;
    throw new Error(message);
  }

  if (!payload) throw new Error("Resposta vazia do servidor.");

  if (
    typeof payload === "object" &&
    payload &&
    "error" in payload &&
    typeof (payload as { error?: string }).error === "string"
  ) {
    throw new Error((payload as { error: string }).error);
  }

  return payload as T;
};

export const qrImageSrc = (qrCode: string | null | undefined) => {
  if (!qrCode) return null;
  return qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`;
};

export const usePlatformWhatsappConnections = () =>
  useQuery({
    queryFn: async () => {
      const result = await invokeWhatsappFunction<ConnectionsResponse>("list-whatsapp-connections", {
        scope: "platform",
      });
      return result.connections;
    },
    queryKey: connectionsQueryKey,
    refetchInterval: (query) => {
      const connections = query.state.data ?? [];
      return connections.some((connection) => connection.status === "connecting") ? 5000 : false;
    },
  });

export const useCreatePlatformWhatsappConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await invokeWhatsappFunction<ConnectionResponse>("create-whatsapp-connection", {
        name,
        scope: "platform",
      });
      return result.connection;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsQueryKey });
    },
  });
};

export const useRegeneratePlatformWhatsappQr = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: number) => {
      const result = await invokeWhatsappFunction<ConnectionResponse>("regenerate-whatsapp-connection-qr", {
        connectionId,
        scope: "platform",
      });
      return result.connection;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsQueryKey });
    },
  });
};

export const useSwitchPlatformWhatsappNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: number) => {
      const result = await invokeWhatsappFunction<ConnectionResponse>("switch-whatsapp-connection-number", {
        connectionId,
        scope: "platform",
      });
      return result.connection;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsQueryKey });
    },
  });
};

export const useDeletePlatformWhatsappConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: number) => {
      await invokeWhatsappFunction<{ ok: boolean }>("delete-whatsapp-connection", {
        connectionId,
        scope: "platform",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsQueryKey });
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });
};

export const usePlatformWhatsappConversations = () =>
  useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_whatsapp_conversations")
        .select("*")
        // Só entra no funil depois da 1ª mensagem enviada ou recebida.
        .not("last_message_at", "is", null)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data ?? []) as PlatformWhatsappConversation[];
    },
    queryKey: conversationsQueryKey,
    refetchInterval: 15000,
  });

export const useUpdatePlatformWhatsappConversationStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      conversationId: number;
      lostReason?: string | null;
      stage: PlatformWhatsappStage;
    }) => {
      const updates: {
        lost_reason?: string | null;
        stage: PlatformWhatsappStage;
      } = {
        stage: input.stage,
      };

      if (input.stage === "perdido") {
        updates.lost_reason = input.lostReason?.trim() || null;
      } else {
        updates.lost_reason = null;
      }

      const { data, error } = await supabase
        .from("platform_whatsapp_conversations")
        .update(updates)
        .eq("id", input.conversationId)
        .select("*")
        .single();

      if (error) throw error;
      return data as PlatformWhatsappConversation;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });
};

export const useUpdatePlatformWhatsappConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      conversationId: number;
      customerName?: string | null;
      lostReason?: string | null;
      stage?: PlatformWhatsappStage;
    }) => {
      const updates: {
        customer_name?: string | null;
        lost_reason?: string | null;
        stage?: PlatformWhatsappStage;
      } = {};

      if (input.customerName !== undefined) {
        const trimmed = input.customerName?.trim() || null;
        updates.customer_name = trimmed;
      }

      if (input.stage !== undefined) {
        updates.stage = input.stage;
        if (input.stage === "perdido") {
          updates.lost_reason = input.lostReason?.trim() || null;
        } else {
          updates.lost_reason = null;
        }
      } else if (input.lostReason !== undefined) {
        updates.lost_reason = input.lostReason?.trim() || null;
      }

      const { data, error } = await supabase
        .from("platform_whatsapp_conversations")
        .update(updates)
        .eq("id", input.conversationId)
        .select("*")
        .single();

      if (error) throw error;
      return data as PlatformWhatsappConversation;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<PlatformWhatsappConversation[]>(conversationsQueryKey, (current) =>
        current?.map((conversation) => (conversation.id === data.id ? data : conversation)),
      );
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });
};

export const useMarkPlatformWhatsappConversationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: number) => {
      const { data, error } = await supabase
        .from("platform_whatsapp_conversations")
        .update({ is_unread: false })
        .eq("id", conversationId)
        .select("*")
        .single();

      if (error) throw error;
      return data as PlatformWhatsappConversation;
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: conversationsQueryKey });
      const previous = queryClient.getQueryData<PlatformWhatsappConversation[]>(conversationsQueryKey);

      queryClient.setQueryData<PlatformWhatsappConversation[]>(conversationsQueryKey, (current) =>
        (current ?? []).map((conversation) =>
          conversation.id === conversationId ? { ...conversation, is_unread: false } : conversation,
        ),
      );

      return { previous };
    },
    onError: (_error, _conversationId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(conversationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });
};

export const usePlatformWhatsappMessages = (conversationId: number | null) =>
  useQuery({
    enabled: conversationId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId as number)
        .order("sent_at", { ascending: true })
        .limit(500);

      if (error) throw error;
      return (data ?? []) as PlatformWhatsappMessage[];
    },
    queryKey: messagesQueryKey(conversationId),
    refetchInterval: 4000,
  });

export const useSendPlatformWhatsappMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      conversationId?: number;
      customerName?: string | null;
      phone?: string;
      radarCompanyId?: number | null;
      text: string;
    }) => {
      const result = await invokeWhatsappFunction<{
        conversation?: PlatformWhatsappConversation;
        message: PlatformWhatsappMessage;
        ok: boolean;
      }>("send-platform-whatsapp-message", {
        conversationId: input.conversationId,
        customerName: input.customerName?.trim() || null,
        phone: input.phone,
        radarCompanyId: input.radarCompanyId ?? null,
        text: input.text,
      });
      return result;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKey(result.message.conversation_id),
      });
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });
};

export const useRefreshPlatformWhatsappAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { conversationId: number; force?: boolean }) => {
      const result = await invokeWhatsappFunction<{
        avatarUrl: string | null;
        conversationId: number;
        ok: boolean;
      }>("refresh-platform-whatsapp-avatar", {
        conversationId: input.conversationId,
        force: input.force === true,
      });
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });
};

export const useEnsurePlatformWhatsappConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { customerName?: string | null; phone: string }) => {
      const result = await invokeWhatsappFunction<{
        conversation: PlatformWhatsappConversation | null;
        created: boolean;
        draft: PlatformWhatsappDraft | null;
        isDraft: boolean;
        ok: boolean;
      }>("ensure-platform-whatsapp-conversation", {
        customerName: input.customerName?.trim() || null,
        phone: input.phone,
      });
      return result;
    },
    onSuccess: (result) => {
      // Draft não entra no funil. Conversa com mensagem atualiza cache.
      if (result.conversation && !result.isDraft) {
        queryClient.setQueryData<PlatformWhatsappConversation[]>(conversationsQueryKey, (current) => {
          const list = current ?? [];
          const exists = list.some((item) => item.id === result.conversation!.id);
          if (exists) {
            return list.map((item) =>
              item.id === result.conversation!.id ? result.conversation! : item,
            );
          }
          return [result.conversation!, ...list];
        });
      }
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    },
  });
};
