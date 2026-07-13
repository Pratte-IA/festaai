/**
 * Dispara testes dos workflows de automação (7 dias antes + boas-vindas)
 * usando dados reais de um evento, mas redirecionando o telefone para teste.
 *
 * Uso:
 *   node scripts/dispatch-automation-test.mjs
 *   node scripts/dispatch-automation-test.mjs --evento-id=693
 *   node scripts/dispatch-automation-test.mjs --only=sete-dias-antes
 *   node scripts/dispatch-automation-test.mjs --only=boas-vindas
 *
 * Requer no .env.local:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "node:fs";

const FESTAAI_REF = "nuhnbqerbaqazkvmqufg";
const DEFAULT_EVENTO_ID = 693;
const DEFAULT_TENANT_ID = 2;
const DEFAULT_TEST_PHONE = "5545999785617";

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

const parseArgs = () => {
  const eventoArg = process.argv.find((arg) => arg.startsWith("--evento-id="));
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  const phoneArg = process.argv.find((arg) => arg.startsWith("--phone="));

  const onlyRaw = onlyArg ? onlyArg.split("=")[1] : "all";
  const workflows =
    onlyRaw === "all"
      ? ["sete-dias-antes", "boas-vindas"]
      : onlyRaw === "sete-dias"
        ? ["sete-dias-antes"]
        : onlyRaw === "boas-vindas"
          ? ["boas-vindas"]
          : [onlyRaw];

  return {
    eventoId: eventoArg ? Number(eventoArg.split("=")[1]) : DEFAULT_EVENTO_ID,
    testPhone: phoneArg ? phoneArg.split("=")[1] : DEFAULT_TEST_PHONE,
    workflows,
  };
};

loadEnvLocal();

const { eventoId, testPhone, workflows } = parseArgs();
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl?.includes(FESTAAI_REF)) {
  console.error(`SUPABASE_URL deve apontar para o projeto FestaAI (${FESTAAI_REF}).`);
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("Defina SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const response = await fetch(`${supabaseUrl}/functions/v1/dispatch-automation-test`, {
  body: JSON.stringify({
    eventoId,
    tenantId: DEFAULT_TENANT_ID,
    testPhone,
    workflows,
  }),
  headers: {
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  },
  method: "POST",
});

const payload = await response.json();
console.log(JSON.stringify(payload, null, 2));

if (!response.ok) {
  process.exit(1);
}

const allOk = (payload.results ?? []).every((entry) => entry.ok);
process.exit(allOk ? 0 : 1);
