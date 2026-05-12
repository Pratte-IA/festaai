const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const providers = {
  asaas: {
    active: true,
    capabilities: ["checkout", "subscriptions", "webhooks", "cancelation"],
  },
  stripe: {
    active: false,
    capabilities: ["checkout", "subscriptions", "webhooks", "cancelation"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  return new Response(JSON.stringify({ defaultProvider: "asaas", providers }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
