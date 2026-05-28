import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { eventosQueryKeys } from "./query-keys";
import { Evento, EventoUpdate } from "./types";
import { isEventoMappedField } from "../configuracoes/closing-form-types";

export interface ClosingFormSubmission {
  eventoId: number;
  fieldValues: Record<string, string>;
  fields: Array<{
    fieldKey: string | null;
    fieldType: string;
    id: string;
    required: boolean;
  }>;
}

export const useEventoClosingResponses = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("evento_closing_responses")
        .select("field_id, value")
        .eq("tenant_id", currentTenantId as number)
        .eq("evento_id", eventoId as number);

      if (error) throw error;

      const responses: Record<string, string> = {};
      (data ?? []).forEach((row) => {
        responses[String(row.field_id)] = row.value ?? "";
      });

      return responses;
    },
    queryKey: eventosQueryKeys.closingResponses(currentTenantId, eventoId),
  });
};

export const useSubmitClosingForm = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ eventoId, fieldValues, fields }: ClosingFormSubmission): Promise<Evento> => {
      if (!currentTenantId || !user) {
        throw new Error("Sessao ou tenant atual indisponivel.");
      }

      const eventoUpdates: EventoUpdate = {
        fechamento_confirmado_em: new Date().toISOString(),
        funil: "festa",
        etapa: "boas_vindas",
        status_interno: "ativo",
      };

      const customResponses: Array<{ field_id: number; value: string }> = [];

      fields.forEach((field) => {
        const value = fieldValues[field.id] ?? "";

        if (field.fieldKey && isEventoMappedField(field.fieldKey)) {
          switch (field.fieldType) {
            case "number":
              eventoUpdates[field.fieldKey] = value === "" ? null : Number(value);
              break;
            case "currency":
              eventoUpdates[field.fieldKey] = value === "" ? 0 : Number(value);
              break;
            default:
              eventoUpdates[field.fieldKey] = value === "" ? null : value;
          }
          return;
        }

        customResponses.push({
          field_id: Number(field.id),
          value,
        });
      });

      const pacoteValue = fieldValues[
        fields.find((field) => field.fieldKey === "valor_pacote")?.id ?? ""
      ];
      const adicionaisValue = fieldValues[
        fields.find((field) => field.fieldKey === "valor_adicionais")?.id ?? ""
      ];

      if (pacoteValue !== undefined && adicionaisValue !== undefined) {
        eventoUpdates.valor_total = Number(pacoteValue || 0) + Number(adicionaisValue || 0);
      }

      const { data: evento, error: eventoError } = await supabase
        .from("eventos")
        .update({
          ...eventoUpdates,
          updated_by: user.id,
        })
        .eq("id", eventoId)
        .eq("tenant_id", currentTenantId)
        .select("*")
        .single()
        .returns<Evento>();

      if (eventoError) throw eventoError;

      if (customResponses.length > 0) {
        const { error: responsesError } = await supabase.from("evento_closing_responses").upsert(
          customResponses.map((response) => ({
            created_by: user.id,
            evento_id: eventoId,
            field_id: response.field_id,
            tenant_id: currentTenantId,
            updated_by: user.id,
            value: response.value,
          })),
          { onConflict: "evento_id,field_id" },
        );

        if (responsesError) throw responsesError;
      }

      return evento;
    },
    onSuccess: (evento) => {
      queryClient.setQueryData(eventosQueryKeys.detail(currentTenantId, evento.id), evento);
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.all(currentTenantId),
      });
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.closingResponses(currentTenantId, evento.id),
      });
    },
  });
};
