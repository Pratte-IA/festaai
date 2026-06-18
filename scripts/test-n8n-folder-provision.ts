/**
 * Teste local: clona pasta Templates N8N para um tenant.
 * Uso: deno run --allow-env --allow-net --allow-read scripts/test-n8n-folder-provision.ts [tenantId]
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const loadEnvLocal = () => {
  const envPath = `${Deno.cwd()}/.env.local`;
  const text = Deno.readTextFileSync(envPath);
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!Deno.env.get(key)) Deno.env.set(key, value);
  }
};

loadEnvLocal();

const tenantId = Number(Deno.args[0] ?? "1");

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  Deno.exit(1);
}

const { provisionTenantN8nWorkflow } = await import("../supabase/functions/_shared/n8n-provision.ts");

const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: tenant, error: tenantError } = await service
  .from("tenants")
  .select("id, name, slug")
  .eq("id", tenantId)
  .maybeSingle();

if (tenantError) throw tenantError;
if (!tenant) {
  console.error(`Tenant ${tenantId} não encontrado.`);
  Deno.exit(1);
}

console.log(`Provisionando N8N para: ${tenant.name} (id=${tenant.id})`);
console.log(`Pasta esperada: "${tenant.name} - FESTAAI"`);

const result = await provisionTenantN8nWorkflow(service, tenant);

console.log(JSON.stringify(result, null, 2));
