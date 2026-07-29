import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import type {
  PlatformWhatsappConnection,
  PlatformWhatsappConversation,
  PlatformWhatsappStage,
} from "./types";

const connectionsQueryKey = ["platform-whatsapp-connections"] as const;
const conversationsQueryKey = ["platform-whatsapp-conversations"] as const;

interface ConnectionsResponse {
  connections: PlatformWhatsappConnection[];
  ok: boolean;
}

interface ConnectionResponse {
  connection: PlatformWhatsappConnection;
  ok: boolean;
}

const resolveFunctionError = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // mantém mensagem padrão
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return "Tente novamente em instantes.";
};

const invokeWhatsappFunction = async <T>(functionName: string, body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke<T>(functionName, { body });

  if (error) throw new Error(await resolveFunctionError(error));
  if (!data) throw new Error("Resposta vazia do servidor.");

  if (typeof data === "object" && data && "error" in data && typeof (data as { error?: string }).error === "string") {
    throw new Error((data as { error: string }).error);
  }

  return data;
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
