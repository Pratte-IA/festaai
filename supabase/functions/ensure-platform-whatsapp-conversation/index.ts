import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedPlatformAdmin } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { toWhatsAppMePhone, toWhatsAppPhoneKey } from "../_shared/phone.ts";
import { refreshPlatformConversationAvatar } from "../_shared/platform-whatsapp-conversation.ts";
import { ensureCrmLeadFromPlatformWhatsapp } from "../_shared/radar-crm-from-whatsapp.ts";

const bodySchema = z.object({
  customerName: z.string().trim().max(200).nullable().optional(),
  phone: z.string().trim().min(8).max(40),
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
    const candidates = phoneCandidates(payload.phone);

    if (candidates.length === 0) {
      return jsonResponse({ ok: false, error: "Telefone inválido para WhatsApp." }, 400);
    }

    const canonicalPhone = candidates[0];
    const customerName = payload.customerName?.trim() || null;

    const { data: connection, error: connectionError } = await service
      .from("whatsapp_connections")
      .select("id, status, phone, name")
      .eq("scope", "platform")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (connectionError) throw connectionError;
    if (!connection) {
      return jsonResponse(
        {
          ok: false,
          error: "Conecte o WhatsApp da plataforma em Conexões antes de iniciar a conversa.",
        },
        409,
      );
    }

    const { data: existingList, error: existingError } = await service
      .from("platform_whatsapp_conversations")
      .select("*")
      .eq("connection_id", connection.id)
      .in("customer_phone", candidates)
      .order("id", { ascending: true })
      .limit(1);

    if (existingError) throw existingError;

    const existing = existingList?.[0] ?? null;

    if (existing) {
      const { count: messageCount, error: countError } = await service
        .from("platform_whatsapp_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", existing.id);

      if (countError) throw countError;

      const hasMessages = (messageCount ?? 0) > 0 || Boolean(existing.last_message_at);

      if (!hasMessages) {
        // Card aberto sem mensagem — remove do funil e devolve draft.
        await service.from("platform_whatsapp_conversations").delete().eq("id", existing.id);

        return jsonResponse({
          created: false,
          isDraft: true,
          conversation: null,
          draft: {
            connection_id: connection.id,
            customer_name: customerName ?? existing.customer_name,
            customer_phone: canonicalPhone,
          },
          ok: true,
        });
      }

      let conversation = existing;
      if (customerName && !existing.customer_name) {
        const { data: updated, error: updateError } = await service
          .from("platform_whatsapp_conversations")
          .update({ customer_name: customerName })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (updateError) throw updateError;
        conversation = updated;
      }

      void refreshPlatformConversationAvatar(service, {
        connectionId: connection.id,
        conversationId: conversation.id,
        customerPhone: conversation.customer_phone,
      });

      try {
        await ensureCrmLeadFromPlatformWhatsapp(service, {
          customerName: conversation.customer_name,
          customerPhone: conversation.customer_phone,
        });
      } catch (crmError) {
        console.error(
          "radar_crm_ensure_lead_from_whatsapp failed:",
          crmError instanceof Error ? crmError.message : crmError,
        );
      }

      return jsonResponse({
        created: false,
        isDraft: false,
        conversation,
        draft: null,
        ok: true,
      });
    }

    // Ainda não há conversa com mensagem — não cria card no funil.
    return jsonResponse({
      created: false,
      isDraft: true,
      conversation: null,
      draft: {
        connection_id: connection.id,
        customer_name: customerName,
        customer_phone: canonicalPhone,
      },
      ok: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
