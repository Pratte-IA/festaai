/**
 * Smoke test do billing Asaas (produção) — sem criar checkout/cobrança real.
 *
 * Uso:
 *   node scripts/validate-asaas-billing.mjs
 *
 * Opcional (cria cliente + assinatura REAL no Asaas produção):
 *   node scripts/validate-asaas-billing.mjs --with-checkout
 */

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

/** @typedef {{ detail?: string, name: string, ok: boolean }} CheckResult */

const loadEnvLocal = () => {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
};

const mask = (value) => {
  if (value.length <= 12) return "***";
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

/** @type {(name: string, fn: () => Promise<string | void>) => Promise<CheckResult>} */
const runCheck = async (name, fn) => {
  try {
    const detail = await fn();
    return { name, ok: true, detail: detail ?? undefined };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};

const parseJson = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 200) };
  }
};

const supabaseHeaders = (anonKey) => ({
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
  "Content-Type": "application/json",
});

loadEnvLocal();

const withCheckout = process.argv.includes("--with-checkout");
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const asaasApiUrl = process.env.ASAAS_PRODUCTION_API_URL ?? "";
const asaasApiKey = process.env.ASAAS_PRODUCTION_API_KEY ?? "";
const webhookToken = process.env.ASAAS_PRODUCTION_WEBHOOK_TOKEN ?? "";
const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`;
const functionsBase = `${supabaseUrl}/functions/v1`;

/** @type {CheckResult[]} */
const results = [];

results.push(
  await runCheck("Variáveis de produção no .env.local", async () => {
    const missing = [
      !supabaseUrl && "SUPABASE_URL",
      !anonKey && "VITE_SUPABASE_ANON_KEY",
      !asaasApiUrl && "ASAAS_PRODUCTION_API_URL",
      !asaasApiKey && "ASAAS_PRODUCTION_API_KEY",
      !webhookToken && "ASAAS_PRODUCTION_WEBHOOK_TOKEN",
    ].filter(Boolean);

    if (missing.length) {
      throw new Error(`Faltando: ${missing.join(", ")}`);
    }

    if (!asaasApiUrl.includes("api.asaas.com")) {
      throw new Error(`ASAAS_PRODUCTION_API_URL não aponta para produção: ${asaasApiUrl}`);
    }

    if (asaasApiKey.includes("hmlg")) {
      throw new Error("ASAAS_PRODUCTION_API_KEY parece ser chave de sandbox (hmlg).");
    }

    return `API ${asaasApiUrl} | key ${mask(asaasApiKey)} | webhook ${mask(webhookToken)}`;
  }),
);

results.push(
  await runCheck("Asaas produção — API autenticada", async () => {
    const response = await fetch(`${asaasApiUrl}/finance/balance`, {
      headers: {
        accept: "application/json",
        access_token: asaasApiKey,
      },
    });

    const body = await parseJson(response);
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${String(body.errors ?? body.raw ?? JSON.stringify(body))}`,
      );
    }

    const balance = body.balance;
    return balance != null ? `Saldo disponível: R$ ${Number(balance).toFixed(2)}` : "Conta autenticada.";
  }),
);

results.push(
  await runCheck("Edge Function billing-provider-router", async () => {
    const response = await fetch(`${functionsBase}/billing-provider-router`, {
      headers: supabaseHeaders(anonKey),
    });
    const body = await parseJson(response);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    if (body.defaultProvider !== "asaas") throw new Error("Provider padrão não é asaas.");
    return "Provider asaas ativo.";
  }),
);

results.push(
  await runCheck("Edge Function create-asaas-checkout (validação Zod)", async () => {
    const response = await fetch(`${functionsBase}/create-asaas-checkout`, {
      body: JSON.stringify({}),
      headers: supabaseHeaders(anonKey),
      method: "POST",
    });
    const body = await parseJson(response);
    if (response.status !== 400) {
      throw new Error(`Esperava 400, recebeu ${response.status}: ${JSON.stringify(body)}`);
    }
    if (!body.error) throw new Error("Resposta 400 sem mensagem de erro.");
    return "Função online; payload inválido rejeitado antes do Asaas.";
  }),
);

results.push(
  await runCheck("Edge Function get-public-checkout-status (ref inexistente)", async () => {
    const response = await fetch(`${functionsBase}/get-public-checkout-status`, {
      body: JSON.stringify({ externalReference: "festaai:00000000-0000-0000-0000-000000000000" }),
      headers: supabaseHeaders(anonKey),
      method: "POST",
    });
    const body = await parseJson(response);
    if (response.status !== 404) {
      throw new Error(`Esperava 404, recebeu ${response.status}: ${JSON.stringify(body)}`);
    }
    return "Consulta pública OK (404 para ref fake).";
  }),
);

results.push(
  await runCheck("Webhook asaas-webhook — rejeita sem token", async () => {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({ event: "PING" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (response.status !== 401) {
      throw new Error(`Esperava 401, recebeu ${response.status}`);
    }
    return "401 Unauthorized sem token.";
  }),
);

results.push(
  await runCheck("Webhook asaas-webhook — rejeita token inválido", async () => {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({ event: "PING" }),
      headers: {
        "Content-Type": "application/json",
        "asaas-access-token": "token-invalido",
      },
      method: "POST",
    });
    if (response.status !== 401) {
      throw new Error(`Esperava 401, recebeu ${response.status}`);
    }
    return "401 Unauthorized com token errado.";
  }),
);

results.push(
  await runCheck("Webhook asaas-webhook — SUBSCRIPTION_CREATED (token produção)", async () => {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({
        event: "SUBSCRIPTION_CREATED",
        id: `validate-${randomUUID()}`,
        subscription: {
          externalReference: "festaai:00000000-0000-0000-0000-000000000000",
          id: "sub_validate_smoke_test",
          status: "ACTIVE",
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "asaas-access-token": webhookToken,
      },
      method: "POST",
    });
    const body = await parseJson(response);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
    if (body.ok !== true) throw new Error(`Resposta inesperada: ${JSON.stringify(body)}`);
    return "200 OK — secret ASAAS_WEBHOOK_TOKEN no Supabase está alinhado.";
  }),
);

if (withCheckout) {
  results.push(
    await runCheck("Checkout REAL produção (opt-in)", async () => {
      const suffix = randomUUID().slice(0, 8);
      const response = await fetch(`${functionsBase}/create-asaas-checkout`, {
        body: JSON.stringify({
          companyName: `FestaAI Smoke Test ${suffix}`,
          cpfCnpj: "24971563792",
          email: `smoke+${suffix}@festaai.com.br`,
          name: `Smoke Test ${suffix}`,
          phone: "11999999999",
          planSlug: "avista",
        }),
        headers: supabaseHeaders(anonKey),
        method: "POST",
      });
      const body = await parseJson(response);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
      }
      if (!body.externalReference) throw new Error("Sem externalReference na resposta.");
      return `Checkout criado: ${String(body.externalReference)} | setup R$ ${body.setupPrice}`;
    }),
  );
}

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);

console.log("\n=== FestaAI — Validação Billing Asaas (produção) ===\n");

for (const result of results) {
  const icon = result.ok ? "✓" : "✗";
  console.log(`${icon} ${result.name}`);
  if (result.detail) console.log(`  → ${result.detail}`);
}

console.log(`\n${passed}/${results.length} checks OK\n`);

if (failed.length) {
  console.log("Falhas:");
  for (const result of failed) {
    console.log(`  - ${result.name}: ${result.detail ?? "erro desconhecido"}`);
  }
  process.exit(1);
}

console.log("Limites deste teste:");
console.log("  • NÃO paga setup/mensalidade (sem Pix/cartão/boleto).");
console.log("  • NÃO valida webhook vindo do painel Asaas (só chamada direta).");
console.log("  • Para fluxo completo: contratar em festaai.com.br com pagamento real.");
if (!withCheckout) {
  console.log("  • Para criar checkout real: rode com --with-checkout (cuidado: produção).");
}
