import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { createServiceClient } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  ensureVilaEncantadaInboundRouting,
  VILA_ENCANTADA_INSTANCE_NAME,
} from "../_shared/ensure-vila-encantada-inbound-routing.ts";
import { syncConnectionWebhook } from "../_shared/evolution-client.ts";

const bodySchema = z.object({
  tenantId: z.number().int().positive().default(2),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const payload = bodySchema.parse(await req.json().catch(() => ({})));
    const service = createServiceClient();
    const connection = await ensureVilaEncantadaInboundRouting(service, payload.tenantId);

    if (!connection) {
      return jsonResponse({ ok: false, error: "Tenant não elegível para este reparo." }, 400);
    }

    let webhookSynced = false;
    try {
      await syncConnectionWebhook(service, connection);
      webhookSynced = true;
    } catch (syncError) {
      console.error(
        "syncConnectionWebhook failed:",
        syncError instanceof Error ? syncError.message : syncError,
      );
    }

    return jsonResponse({
      connection,
      instanceName: VILA_ENCANTADA_INSTANCE_NAME,
      ok: true,
      webhookSynced,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }

    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
