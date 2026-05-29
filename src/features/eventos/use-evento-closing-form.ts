import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";

import { isEventoMappedField } from "../configuracoes/closing-form-types";
import {
  type AcceptanceResponsePayload,
  type AdicionalSnapshotItem,
} from "./closing-form-runtime";
import { eventosQueryKeys } from "./query-keys";
import { Evento, EventoUpdate } from "./types";

export interface ClosingFormSubmission {
  acceptanceResponses?: AcceptanceResponsePayload[];
  adicionaisSnapshot?: AdicionalSnapshotItem[] | null;
  eventoId: number;
  fieldValues: Record<string, string>;
  fields: Array<{
    fieldKey: string | null;
    fieldType: string;
    id: string;
    required: boolean;
  }>;
  pacoteId?: number | null;
  packageEventoUpdates?: Pick<
    EventoUpdate,
    "pacote_convidados_inclusos" | "pacote_nome" | "valor_pacote"
  >;
}

const applyFieldValueToEvento = (
  eventoUpdates: EventoUpdate,
  fieldKey: string,
  fieldType: string,
  value: string,
) => {
  switch (fieldType) {
    case "number":
      (eventoUpdates as Record<string, unknown>)[fieldKey] = value === "" ? null : Number(value);
      break;
    case "currency":
      (eventoUpdates as Record<string, unknown>)[fieldKey] = value === "" ? 0 : Number(value);
      break;
    default:
      (eventoUpdates as Record<string, unknown>)[fieldKey] = value === "" ? null : value;
  }
};

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

export const useEventoAcceptanceResponses = (eventoId: number | null) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId && eventoId),
    queryFn: async (): Promise<Record<string, boolean>> => {
      const { data, error } = await supabase
        .from("evento_acceptance_responses")
        .select("term_id, accepted")
        .eq("tenant_id", currentTenantId as number)
        .eq("evento_id", eventoId as number);

      if (error) throw error;

      const responses: Record<string, boolean> = {};
      (data ?? []).forEach((row) => {
        responses[String(row.term_id)] = row.accepted;
      });

      return responses;
    },
    queryKey: eventosQueryKeys.acceptanceResponses(currentTenantId, eventoId),
  });
};

export const useSubmitClosingForm = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useCurrentTenant();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      acceptanceResponses = [],
      adicionaisSnapshot = null,
      eventoId,
      fieldValues,
      fields,
      pacoteId = null,
      packageEventoUpdates,
    }: ClosingFormSubmission): Promise<Evento> => {
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
          if (
            packageEventoUpdates &&
            (field.fieldKey === "pacote_nome" ||
              field.fieldKey === "valor_pacote" ||
              field.fieldKey === "pacote_convidados_inclusos")
          ) {
            return;
          }

          applyFieldValueToEvento(eventoUpdates, field.fieldKey, field.fieldType, value);
          return;
        }

        customResponses.push({
          field_id: Number(field.id),
          value,
        });
      });

      if (packageEventoUpdates) {
        Object.assign(eventoUpdates, packageEventoUpdates);
      }

      const pacoteValue =
        packageEventoUpdates?.valor_pacote ??
        fieldValues[fields.find((field) => field.fieldKey === "valor_pacote")?.id ?? ""];
      const adicionaisValue = fieldValues[
        fields.find((field) => field.fieldKey === "valor_adicionais")?.id ?? ""
      ];
      const entradaValue = fieldValues[
        fields.find((field) => field.fieldKey === "valor_entrada")?.id ?? ""
      ];
      const saldoFieldId = fields.find((field) => field.fieldKey === "valor_saldo")?.id;

      if (pacoteValue != null && adicionaisValue !== undefined) {
        eventoUpdates.valor_total = Number(pacoteValue || 0) + Number(adicionaisValue || 0);
      }

      if (saldoFieldId) {
        eventoUpdates.valor_saldo = Number(fieldValues[saldoFieldId] || 0);
      } else if (eventoUpdates.valor_total !== undefined) {
        eventoUpdates.valor_saldo = Math.max(
          Number(eventoUpdates.valor_total || 0) - Number(entradaValue || 0),
          0,
        );
      }

      if (pacoteId != null) {
        eventoUpdates.pacote_id = pacoteId;
      }

      if (adicionaisSnapshot != null) {
        eventoUpdates.adicionais_snapshot = adicionaisSnapshot as unknown as Json;
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

      if (acceptanceResponses.length > 0) {
        const now = new Date().toISOString();
        const { error: acceptanceError } = await supabase.from("evento_acceptance_responses").upsert(
          acceptanceResponses.map((response) => ({
            accepted: response.accepted,
            accepted_at: response.accepted ? now : null,
            created_by: user.id,
            evento_id: eventoId,
            tenant_id: currentTenantId,
            term_id: response.termId,
            updated_by: user.id,
          })),
          { onConflict: "evento_id,term_id" },
        );

        if (acceptanceError) throw acceptanceError;
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
      void queryClient.invalidateQueries({
        queryKey: eventosQueryKeys.acceptanceResponses(currentTenantId, evento.id),
      });
    },
  });
};
