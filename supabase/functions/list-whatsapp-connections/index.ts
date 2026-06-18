import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { resolveAuthedTenantMember } from "../_shared/auth-tenant.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  evolutionFetch,
  extractConnectionPhone,
  extractQrCode,
  mapEvolutionStateToStatus,
  tryFetchQrCode,
} from "../_shared/evolution-client.ts";

const bodySchema = z.object({
  tenantId: z.number().int().positive(),
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
    const auth = await resolveAuthedTenantMember(req, payload.tenantId);
    if (auth instanceof Response) return auth;

    const { service, tenantId } = auth;

    const { data: connections, error: listError } = await service
      .from("whatsapp_connections")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (listError) throw listError;

    const refreshed = [];

    for (const connection of connections ?? []) {
      let status = connection.status;
      let phone = connection.phone;
      let qrCode = connection.qr_code;
      let lastError = connection.last_error;
      let lastSeenAt = connection.last_seen_at;

      try {
        const stateResult = await evolutionFetch(`/instance/connectionState/${connection.instance_name}`);
        if (stateResult.ok && stateResult.body) {
          const instance = stateResult.body.instance as Record<string, unknown> | undefined;
          const stateValue =
            typeof instance?.state === "string"
              ? instance.state
              : typeof stateResult.body.state === "string"
                ? stateResult.body.state
                : undefined;

          status = mapEvolutionStateToStatus(stateValue);

          if (status === "connected") {
            qrCode = null;
            phone = extractConnectionPhone(stateResult.body) ?? phone;
            lastSeenAt = new Date().toISOString();
            lastError = null;
          }

          if (status === "connecting" && !qrCode) {
            qrCode = extractQrCode(stateResult.body) ?? (await tryFetchQrCode(connection.instance_name));
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Falha ao consultar Evolution.";
        if (connection.status !== "connected") {
          status = "error";
        }
      }

      const updates = {
        last_error: lastError,
        last_seen_at: lastSeenAt,
        phone,
        qr_code: qrCode,
        status,
        updated_at: new Date().toISOString(),
      };

      const { data: saved, error: saveError } = await service
        .from("whatsapp_connections")
        .update(updates)
        .eq("id", connection.id)
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

      if (saveError) {
        refreshed.push(connection);
      } else {
        refreshed.push(saved);
      }
    }

    return jsonResponse({ ok: true, connections: refreshed });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ ok: false, error: "Dados inválidos." }, 400);
    }
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
