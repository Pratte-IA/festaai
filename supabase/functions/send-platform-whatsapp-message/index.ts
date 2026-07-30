import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedPlatformAdmin } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sendEvolutionTextMessage } from "../_shared/evolution-send-text.ts";
import { toWhatsAppMePhone, toWhatsAppPhoneKey } from "../_shared/phone.ts";
import { ensureCrmLeadFromPlatformWhatsapp } from "../_shared/radar-crm-from-whatsapp.ts";

const bodySchema = z
  .object({
    conversationId: z.number().int().positive().optional(),
    customerName: z.string().trim().max(200).nullable().optional(),
    phone: z.string().trim().min(8).max(40).optional(),
    radarCompanyId: z.number().int().positive().nullable().optional(),
    text: z.string().trim().min(1).max(4000),
  })
  .refine((value) => value.conversationId != null || Boolean(value.phone?.trim()), {
    message: "conversationId ou phone é obrigatório",
  });

const phoneCandidates = (phone: string): string[] => {
  const key = toWhatsAppPhoneKey(phone);
  const me = toWhatsAppMePhone(phone);
  return [...new Set([key, me].filter((value): value is string => Boolean(value)))];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const payload = bodySchema.parse(await req.json());
    const auth = await resolveAuthedPlatformAdmin(req);
    if (auth instanceof Response) return auth;

    const { service } = auth;

    let conversation: {
      id: number;
      connection_id: number;
      customer_phone: string;
      customer_name: string | null;
    } | null = null;

    if (payload.conversationId != null) {
      const { data, error } = await service
        .from("platform_whatsapp_conversations")
        .select("id, connection_id, customer_phone, customer_name")
        .eq("id", payload.conversationId)
        .maybeSingle();

      if (error) throw error;
      conversation = data;
      if (!conversation) {
        return jsonResponse({ ok: false, error: "Conversa não encontrada." }, 404);
      }
    } else {
      const candidates = phoneCandidates(payload.phone as string);
      if (candidates.length === 0) {
        return jsonResponse({ ok: false, error: "Telefone inválido para WhatsApp." }, 400);
      }

      const canonicalPhone = candidates[0];
      const customerName = payload.customerName?.trim() || null;

      const { data: connection, error: connectionLookupError } = await service
        .from("whatsapp_connections")
        .select("id, instance_name, status, scope")
        .eq("scope", "platform")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (connectionLookupError) throw connectionLookupError;
      if (!connection) {
        return jsonResponse(
          { ok: false, error: "Conexão da plataforma não encontrada." },
          404,
        );
      }

      const { data: existingList, error: existingError } = await service
        .from("platform_whatsapp_conversations")
        .select("id, connection_id, customer_phone, customer_name")
        .eq("connection_id", connection.id)
        .in("customer_phone", candidates)
        .order("id", { ascending: true })
        .limit(1);

      if (existingError) throw existingError;
      conversation = existingList?.[0] ?? null;

      if (!conversation) {
        const { data: created, error: insertError } = await service
          .from("platform_whatsapp_conversations")
          .insert({
            connection_id: connection.id,
            customer_name: customerName,
            customer_phone: canonicalPhone,
            is_unread: false,
            last_message_at: null,
            last_message_preview: null,
            stage: "contato_inicial",
          })
          .select("id, connection_id, customer_phone, customer_name")
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            const { data: raced, error: raceError } = await service
              .from("platform_whatsapp_conversations")
              .select("id, connection_id, customer_phone, customer_name")
              .eq("connection_id", connection.id)
              .in("customer_phone", candidates)
              .order("id", { ascending: true })
              .limit(1)
              .maybeSingle();
            if (raceError) throw raceError;
            conversation = raced;
          } else {
            throw insertError;
          }
        } else {
          conversation = created;
        }
      } else if (customerName && !conversation.customer_name) {
        const { data: updated, error: updateError } = await service
          .from("platform_whatsapp_conversations")
          .update({ customer_name: customerName })
          .eq("id", conversation.id)
          .select("id, connection_id, customer_phone, customer_name")
          .single();
        if (updateError) throw updateError;
        conversation = updated;
      }
    }

    if (!conversation) {
      return jsonResponse({ ok: false, error: "Não foi possível preparar a conversa." }, 500);
    }

    const { data: connection, error: connectionError } = await service
      .from("whatsapp_connections")
      .select("id, instance_name, status, scope")
      .eq("id", conversation.connection_id)
      .eq("scope", "platform")
      .maybeSingle();

    if (connectionError) throw connectionError;
    if (!connection) {
      return jsonResponse({ ok: false, error: "Conexão da plataforma não encontrada." }, 404);
    }

    if (connection.status !== "connected") {
      return jsonResponse({ ok: false, error: "WhatsApp da plataforma não está conectado." }, 409);
    }

    const { data: secret } = await service
      .from("whatsapp_connection_webhook_secrets")
      .select("instance_api_key")
      .eq("connection_id", connection.id)
      .maybeSingle();

    const sendResult = await sendEvolutionTextMessage({
      instanceApiKey: secret?.instance_api_key ?? null,
      instanceName: connection.instance_name,
      number: conversation.customer_phone,
      text: payload.text,
    });

    if (!sendResult.ok) {
      return jsonResponse(
        {
          ok: false,
          error: sendResult.errorMessage ?? "Falha ao enviar mensagem no WhatsApp.",
        },
        502,
      );
    }

    const sentAt = new Date().toISOString();
    const preview =
      payload.text.length > 160 ? `${payload.text.slice(0, 159)}…` : payload.text;

    const { data: message, error: messageError } = await service
      .from("platform_whatsapp_messages")
      .insert({
        body: payload.text,
        connection_id: connection.id,
        conversation_id: conversation.id,
        direction: "outbound",
        evolution_message_id: sendResult.messageId,
        from_me: true,
        message_type: "text",
        sent_at: sentAt,
      })
      .select("*")
      .single();

    if (messageError) throw messageError;

    const { data: updatedConversation, error: conversationUpdateError } = await service
      .from("platform_whatsapp_conversations")
      .update({
        last_message_at: sentAt,
        last_message_preview: preview,
        is_unread: false,
      })
      .eq("id", conversation.id)
      .select("*")
      .single();

    if (conversationUpdateError) throw conversationUpdateError;

    try {
      await ensureCrmLeadFromPlatformWhatsapp(service, {
        customerName: conversation.customer_name,
        customerPhone: conversation.customer_phone,
        radarCompanyId: payload.radarCompanyId ?? null,
      });
    } catch (crmError) {
      console.error(
        "radar_crm_ensure_lead_from_whatsapp failed:",
        crmError instanceof Error ? crmError.message : crmError,
      );
    }

    return jsonResponse({
      ok: true,
      message,
      conversation: updatedConversation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
