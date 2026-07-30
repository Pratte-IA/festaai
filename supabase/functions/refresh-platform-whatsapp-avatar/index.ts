import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedPlatformAdmin } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { refreshPlatformConversationAvatar } from "../_shared/platform-whatsapp-conversation.ts";

const bodySchema = z.object({
  conversationId: z.number().int().positive(),
  force: z.boolean().optional(),
});

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

    const { data: conversation, error } = await service
      .from("platform_whatsapp_conversations")
      .select("id, connection_id, customer_phone, avatar_url")
      .eq("id", payload.conversationId)
      .maybeSingle();

    if (error) throw error;
    if (!conversation) {
      return jsonResponse({ ok: false, error: "Conversa não encontrada." }, 404);
    }

    const avatarUrl = await refreshPlatformConversationAvatar(service, {
      connectionId: conversation.connection_id,
      conversationId: conversation.id,
      customerPhone: conversation.customer_phone,
      force: payload.force === true,
    });

    return jsonResponse({
      ok: true,
      avatarUrl,
      conversationId: conversation.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
