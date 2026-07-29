import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedPlatformAdmin, resolveAuthedTenantMember } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  logoutEvolutionInstance,
  syncConnectionWebhook,
  tryFetchQrCode,
} from "../_shared/evolution-client.ts";

const bodySchema = z.object({
  connectionId: z.number().int().positive(),
  scope: z.enum(["tenant", "platform"]).default("tenant"),
  tenantId: z.number().int().positive().optional(),
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
    const isPlatform = payload.scope === "platform";

    if (!isPlatform && payload.tenantId == null) {
      return jsonResponse({ ok: false, error: "tenantId é obrigatório." }, 400);
    }

    const auth = isPlatform
      ? await resolveAuthedPlatformAdmin(req)
      : await resolveAuthedTenantMember(req, payload.tenantId as number, { requireAdmin: true });
    if (auth instanceof Response) return auth;

    const { service } = auth;
    const tenantId = isPlatform ? null : (auth as { tenantId: number }).tenantId;

    let fetchQuery = service
      .from("whatsapp_connections")
      .select("*")
      .eq("id", payload.connectionId);

    if (isPlatform) {
      fetchQuery = fetchQuery.eq("scope", "platform");
    } else {
      fetchQuery = fetchQuery.eq("tenant_id", tenantId).eq("scope", "tenant");
    }

    const { data: connection, error: fetchError } = await fetchQuery.maybeSingle();

    if (fetchError) throw fetchError;
    if (!connection) {
      return jsonResponse({ ok: false, error: "Conexão não encontrada." }, 404);
    }

    try {
      await syncConnectionWebhook(service, connection);
    } catch {
      // best-effort — mantém webhook antes de trocar o número
    }

    try {
      await logoutEvolutionInstance(connection.instance_name);
    } catch {
      // best-effort — instância pode já estar desconectada
    }

    const qrCode = await tryFetchQrCode(connection.instance_name);

    if (!qrCode) {
      return jsonResponse(
        {
          ok: false,
          error: "Não foi possível gerar o QR Code após desconectar.",
          provider_status: 502,
        },
        502,
      );
    }

    let updateQuery = service
      .from("whatsapp_connections")
      .update({
        last_error: null,
        phone: null,
        qr_code: qrCode,
        status: "connecting",
      })
      .eq("id", connection.id);

    if (isPlatform) {
      updateQuery = updateQuery.eq("scope", "platform");
    } else {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { data: updated, error: updateError } = await updateQuery.select("*").single();

    if (updateError) throw updateError;

    return jsonResponse({ ok: true, connection: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
