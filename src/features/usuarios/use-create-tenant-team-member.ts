import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

export type AppTeamRole = "admin" | "member";

export interface CreateTenantTeamMemberInput {
  appRole: AppTeamRole;
  cpf: string;
  email: string;
  fullName: string;
  password: string;
}

const readInvokeErrorMessage = (body: unknown, fallback: string) => {
  if (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return fallback;
};

export const useCreateTenantTeamMember = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { currentTenantId } = useCurrentTenant();

  return useMutation({
    mutationFn: async (input: CreateTenantTeamMemberInput) => {
      if (currentTenantId == null) {
        throw new Error("Nenhuma empresa ativa.");
      }
      if (!session?.access_token) {
        throw new Error("Sessão expirada. Entre novamente.");
      }

      const { data, error } = await supabase.functions.invoke<{ error?: string; userId?: string }>(
        "create-tenant-team-member",
        {
          body: {
            appRole: input.appRole,
            cpf: input.cpf,
            email: input.email,
            fullName: input.fullName,
            password: input.password,
            tenantId: currentTenantId,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        throw new Error(error.message || "Falha ao criar usuário.");
      }

      if (data && typeof data === "object" && "error" in data && data.error) {
        throw new Error(readInvokeErrorMessage(data, "Não foi possível criar o usuário."));
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant-team-members"] });
    },
  });
};
