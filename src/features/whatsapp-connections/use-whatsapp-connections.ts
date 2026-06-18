import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";
import { supabase } from "@/lib/supabase/client";

import type {
  WhatsappConnection,
  WhatsappConnectionResponse,
  WhatsappConnectionsResponse,
} from "./types";

const queryKey = (tenantId: number | null) => ["whatsapp-connections", tenantId] as const;

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

export const useWhatsappConnections = () => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: async () => {
      const result = await invokeWhatsappFunction<WhatsappConnectionsResponse>("list-whatsapp-connections", {
        tenantId: currentTenantId as number,
      });
      return result.connections;
    },
    queryKey: queryKey(currentTenantId),
    refetchInterval: (query) => {
      const connections = query.state.data ?? [];
      return connections.some((connection) => connection.status === "connecting") ? 5000 : false;
    },
  });
};

export const useCreateWhatsappConnection = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (name: string) => {
      const result = await invokeWhatsappFunction<WhatsappConnectionResponse>("create-whatsapp-connection", {
        name,
        tenantId: currentTenantId as number,
      });
      return result.connection;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKey(currentTenantId) });
    },
  });
};

export const useRegenerateWhatsappConnectionQr = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (connectionId: number) => {
      const result = await invokeWhatsappFunction<WhatsappConnectionResponse>(
        "regenerate-whatsapp-connection-qr",
        {
          connectionId,
          tenantId: currentTenantId as number,
        },
      );
      return result.connection;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKey(currentTenantId) });
    },
  });
};

export const useDeleteWhatsappConnection = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (connectionId: number) => {
      await invokeWhatsappFunction<{ ok: boolean }>("delete-whatsapp-connection", {
        connectionId,
        tenantId: currentTenantId as number,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKey(currentTenantId) });
    },
  });
};

export const useWhatsappConnectionAdmin = () => {
  const { data, isLoading } = useTenantAdminCapability();
  return {
    canManage: Boolean(data?.isTenantAdmin),
    isLoading,
  };
};

export const qrImageSrc = (qrCode: string | null | undefined) => {
  if (!qrCode) return null;
  return qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`;
};

export type { WhatsappConnection };
