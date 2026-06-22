import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const leadSchema = z.object({
  companyName: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().max(2000).optional().nullable(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(30),
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração do servidor incompleta.");
    }

    const input = leadSchema.parse(await req.json());
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("commercial_leads")
      .insert({
        company_name: input.companyName,
        email: input.email,
        message: input.message?.trim() ?? "",
        name: input.name,
        phone: input.phone,
        status: "novo",
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({ leadId: data.id, status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao enviar solicitação.";
    return jsonResponse({ error: message }, 400);
  }
});
