import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedTenantMember } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { tryFetchQrCode } from "../_shared/evolution-client.ts";

const bodySchema = z.object({
  tenantId: z.number().int().positive(),
  connectionId: z.number().int().positive(),
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
    const auth = await resolveAuthedTenantMember(req, payload.tenantId, { requireAdmin: true });
    if (auth instanceof Response) return auth;

    const { service, tenantId } = auth;

    const { data: connection, error: fetchError } = await service
      .from("whatsapp_connections")
      .select("*")
      .eq("id", payload.connectionId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!connection) {
      return jsonResponse({ ok: false, error: "Conexão não encontrada." }, 404);
    }

    const qrCode = await tryFetchQrCode(connection.instance_name);

    if (!qrCode) {
      return jsonResponse(
        {
          ok: false,
          error: "Não foi possível gerar o QR Code.",
          provider_status: 502,
        },
        502,
      );
    }

    const { data: updated, error: updateError } = await service
      .from("whatsapp_connections")
      .update({
        last_error: null,
        qr_code: qrCode,
        status: "connecting",
      })
      .eq("id", connection.id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

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
