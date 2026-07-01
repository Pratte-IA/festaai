/**
 * Dispara manualmente a Edge Function de reajuste anual (IPCA + Asaas).
 *
 * Uso:
 *   pnpm billing:annual-adjustment
 *   pnpm billing:annual-adjustment -- --dry-run   (só consulta IPCA)
 */

import { readFileSync } from "node:fs";

const loadEnvLocal = () => {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1).replace(/^"|"$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local opcional
  }
};

const dryRun = process.argv.includes("--dry-run");

loadEnvLocal();

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.BILLING_ANNUAL_ADJUSTMENT_CRON_SECRET ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

if (dryRun) {
  const response = await fetch(
    "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json",
  );
  const rows = await response.json();
  let factor = 1;
  for (const row of rows) {
    factor *= 1 + Number(row.valor) / 100;
  }
  const rate = factor - 1;
  console.log(`IPCA acumulado 12 meses: ${(rate * 100).toFixed(2)}%`);
  process.exit(0);
}

const response = await fetch(`${supabaseUrl}/functions/v1/process-annual-billing-adjustments`, {
  body: "{}",
  headers: {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    apikey: serviceRoleKey,
    ...(cronSecret ? { "x-cron-secret": cronSecret } : {}),
  },
  method: "POST",
});

const payload = await response.json().catch(() => ({}));
console.log(JSON.stringify(payload, null, 2));
process.exit(response.ok ? 0 : 1);
