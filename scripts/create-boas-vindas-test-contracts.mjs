/**
 * Cria 4 contratos de teste (um por pacote) e assina cada um,
 * disparando a automação de Boas Vindas no N8N.
 *
 * Uso: node scripts/create-boas-vindas-test-contracts.mjs
 * Requer SUPABASE_SERVICE_ROLE_KEY no ambiente (ou via supabase projects api-keys).
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://nuhnbqerbaqazkvmqufg.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aG5icWVyYmFxYXprdm1xdWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzkyOTQsImV4cCI6MjA3NjA1NTI5NH0.BmNuPIT-zk5RFhKLvbO465iZ6kqcs5LZKPIczXKJam4";
const TENANT_ID = 2;
const TENANT_SLUG = "vila-encantada";
const CLIENT_PHONE = "45999785617";
const CLIENT_PHONE_STORAGE = "5545999785617";
const FORM_URL = `${SUPABASE_URL}/functions/v1/client-contract-form`;

const TESTS = [
  {
    aniversariante: "Pedro Teste Básico",
    cliente: "Ana Teste Básico",
    dataEvento: "2026-08-15",
    guests: 50,
    horaEvento: "15:00",
    key: "basico",
    pacoteId: 4,
    pacoteNome: "Pacote Básico",
    tema: "Super Heróis",
    valorPacote: 1990,
  },
  {
    aniversariante: "Sofia Teste Roda Gigante",
    cliente: "Bruno Teste Roda Gigante",
    dataEvento: "2026-09-12",
    guests: 50,
    horaEvento: "16:00",
    key: "roda_gigante",
    pacoteId: 6,
    pacoteNome: "Pacote Roda Gigante",
    tema: "Frozen",
    valorPacote: 6714,
  },
  {
    aniversariante: "Miguel Teste Café Colonial",
    cliente: "Carla Teste Café Colonial",
    dataEvento: "2026-10-10",
    guests: 50,
    horaEvento: "14:00",
    key: "cafe_colonial",
    pacoteId: 7,
    pacoteNome: "Pacote Café Colonial",
    tema: "Safari",
    valorPacote: 7050.16,
  },
  {
    aniversariante: "Laura Teste Carrossel",
    cliente: "Diana Teste Carrossel",
    dataEvento: "2026-11-14",
    guests: 50,
    horaEvento: "17:00",
    key: "carrossel",
    pacoteId: 5,
    pacoteNome: "Pacote Carrossel",
    tema: "Princesas",
    valorPacote: 5779,
  },
];

const resolveServiceRoleKey = async () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) return null;

  const response = await fetch(
    "https://api.supabase.com/v1/projects/nuhnbqerbaqazkvmqufg/api-keys",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) return null;

  const keys = await response.json();
  const serviceRole = keys.find((entry) => entry.name === "service_role");
  return serviceRole?.api_key ?? null;
};

const postForm = async (body) => {
  const response = await fetch(FORM_URL, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? JSON.stringify(payload));
  }

  return payload;
};

const loadForm = async () => postForm({ action: "load", tenantSlug: TENANT_SLUG });

const buildSubmitPayload = (form, test) => {
  const valorEntrada = 500;
  const valorAdicionais = 0;
  const valorTotal = Number(test.valorPacote) + valorAdicionais;
  const valorSaldo = Math.max(valorTotal - valorEntrada, 0);

  const fieldValues = {
    15: test.cliente,
    16: CLIENT_PHONE,
    17: `${test.key}@teste.festaai.local`,
    18: test.aniversariante,
    19: "2018-05-20",
    20: test.dataEvento,
    21: test.horaEvento,
    22: String(test.guests),
    23: test.pacoteNome,
    25: String(valorAdicionais),
    26: String(valorTotal),
    27: String(valorEntrada),
    28: `Contrato teste N8N — pacote ${test.key}`,
    53: "529.982.247-25",
    55: "85801-020",
    56: "Rua Teste Automação",
    57: "100",
    58: "Centro",
    59: "Cascavel",
    60: "PR",
    72: "Pix",
    74: "Pix",
    75: "1",
    76: test.dataEvento,
    77: test.tema,
    78: "Buffet",
  };

  return {
    acceptanceResponses: (form.acceptanceTerms ?? [])
      .filter((term) => term.isRequired)
      .map((term) => ({ accepted: true, termId: Number(term.id) })),
    action: "submit",
    adicionaisSnapshot: [],
    balancePaymentSchedule: "7_dias_antes",
    fieldValues,
    fields: (form.fields ?? []).map((field) => ({
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      id: field.id,
      required: field.required,
    })),
    pacoteId: test.pacoteId,
    packageEventoUpdates: {
      pacote_convidados_inclusos: test.guests,
      pacote_nome: test.pacoteNome,
      valor_pacote: test.valorPacote,
    },
    tenantSlug: TENANT_SLUG,
  };
};

const insertPlaceholderEvento = async (serviceRoleKey, test) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/eventos`, {
    body: JSON.stringify({
      aniversariante_nome: test.aniversariante,
      cliente_nome: test.cliente,
      cliente_telefone: CLIENT_PHONE_STORAGE,
      data_evento: test.dataEvento,
      etapa: "boas_vindas",
      funil: "festa",
      hora_evento: test.horaEvento,
      observacoes: `Placeholder teste N8N ${test.key}`,
      origem: "teste_boas_vindas",
      pacote_id: test.pacoteId,
      pacote_nome: test.pacoteNome,
      quantidade_convidados: test.guests,
      status_interno: "ativo",
      tenant_id: TENANT_ID,
      tipo_evento: "festa",
      valor_adicionais: 0,
      valor_entrada: 0,
      valor_pacote: test.valorPacote,
      valor_saldo: 0,
      valor_total: test.valorPacote,
    }),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      apikey: serviceRoleKey,
    },
    method: "POST",
  });

  const rows = await response.json();
  if (!response.ok) {
    throw new Error(typeof rows === "object" ? JSON.stringify(rows) : "Falha ao inserir evento");
  }

  return rows[0];
};

const bumpEventoUpdatedAt = async (serviceRoleKey, eventoId) => {
  const now = new Date().toISOString();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/eventos?id=eq.${eventoId}&tenant_id=eq.${TENANT_ID}`, {
    body: JSON.stringify({ updated_at: now }),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
    },
    method: "PATCH",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao atualizar evento ${eventoId}: ${body}`);
  }
};

const acceptContract = async (submitResult, test) => {
  const signingTerms = submitResult.signingTerms ?? [];
  const termAcceptances = signingTerms.map((term) => ({
    accepted: true,
    termId: Number(term.id),
  }));

  return postForm({
    acceptedByEmail: `${test.key}@teste.festaai.local`,
    acceptedByName: test.cliente,
    acceptedByPhone: CLIENT_PHONE,
    action: "accept_contract",
    clientPhone: CLIENT_PHONE,
    contractId: submitResult.contractId,
    eventoId: submitResult.eventoId,
    tenantSlug: TENANT_SLUG,
    termAcceptances,
  });
};

const main = async () => {
  const serviceRoleKey = await resolveServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ACCESS_TOKEN.");
  }

  const form = await loadForm();
  const results = [];

  for (const [index, test] of TESTS.entries()) {
    console.log(`\n=== ${index + 1}/4 — ${test.pacoteNome} ===`);

    if (index > 0) {
      const inserted = await insertPlaceholderEvento(serviceRoleKey, test);
      await bumpEventoUpdatedAt(serviceRoleKey, inserted.id);
      console.log(`Evento placeholder criado: #${inserted.id}`);
    }

    const submitResult = await postForm(buildSubmitPayload(form, test));
    console.log(`Formulário enviado — evento #${submitResult.eventoId}, contrato #${submitResult.contractId}`);

    const acceptResult = await acceptContract(submitResult, test);
    console.log(`Contrato assinado — dispatch:`, acceptResult.whatsappDispatch ?? acceptResult);

    results.push({
      aniversariante: test.aniversariante,
      cliente: test.cliente,
      contractId: submitResult.contractId,
      contractNumber: submitResult.contractNumber,
      dispatch: acceptResult.whatsappDispatch ?? null,
      eventoId: submitResult.eventoId,
      pacote: test.pacoteNome,
    });
  }

  console.log("\n=== RESUMO ===");
  console.table(results);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
