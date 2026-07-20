/**
 * Código de referência para ajuste MANUAL do workflow n8n do precificador.
 * NÃO é importado pela aplicação. Copiar/adaptar nos nodes do n8n.
 *
 * Fluxo esperado:
 *   Code 1 (extrai) → RPC check_tenant_holidays → Code 1b (este arquivo) → Code 2 → Code 3 → Code 4
 */

// ---------------------------------------------------------------------------
// Node: HTTP Request / Supabase — check_tenant_holidays
// Method: POST
// URL: {{$env.SUPABASE_URL}}/rest/v1/rpc/check_tenant_holidays
// Headers: apikey + Authorization Bearer (service_role)
// Body JSON:
// {
//   "p_tenant_id": {{ tenant_id numérico }},
//   "p_dates": ["2026-01-01", "2026-08-15"]
// }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Code 1b — Enriquece itens com feriado
// Entradas: itens do Code 1 + resposta da RPC
// Saída: mesmos itens + is_feriado, feriado_nome, feriado_kind, feriado_scope, feriado_source
// Code 2 deve ler DESTE node (não mais do Code 1).
// ---------------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateKey(value) {
  if (value == null) return null;
  const text = String(value).trim().slice(0, 10);
  return ISO_DATE.test(text) ? text : null;
}

const code1Items = $items("Code 1 - Extrai dados da query"); // ajustar nome exato do node
const rpcItems = $input.all(); // resposta da RPC neste branch, ou $items("RPC check_tenant_holidays")

const tenantIds = new Set();
for (const item of code1Items) {
  const tenantId = item.json.tenant_id;
  if (tenantId == null) {
    throw new Error("Item sem tenant_id no Code 1.");
  }
  tenantIds.add(String(tenantId));
}

if (tenantIds.size > 1) {
  // Futuro: agrupar por tenant e chamar a RPC uma vez por tenant.
  throw new Error(
    `Lote com múltiplos tenant_id (${[...tenantIds].join(", ")}). Agrupe as consultas por tenant.`,
  );
}

const holidayByDate = new Map();
for (const item of rpcItems) {
  const rows = Array.isArray(item.json) ? item.json : [item.json];
  for (const row of rows) {
    const key = normalizeDateKey(row.date);
    if (!key) {
      throw new Error(`RPC retornou data inválida: ${JSON.stringify(row.date)}`);
    }
    holidayByDate.set(key, row);
  }
}

const enriched = [];
for (const item of code1Items) {
  const dateKey = normalizeDateKey(item.json.data || item.json.data_evento || item.json.date);
  if (!dateKey) {
    throw new Error(`Data inválida no item: ${JSON.stringify(item.json)}`);
  }

  const match = holidayByDate.get(dateKey);
  if (!match) {
    throw new Error(
      `A RPC não retornou correspondência para a data ${dateKey}. Verifique o batch enviado.`,
    );
  }

  enriched.push({
    json: {
      ...item.json,
      data: dateKey,
      is_feriado: Boolean(match.is_holiday),
      feriado_nome: match.holiday_name ?? null,
      feriado_kind: match.holiday_kind ?? null,
      feriado_scope: match.holiday_scope ?? null,
      feriado_source: match.holiday_source ?? null,
    },
  });
}

return enriched;

// ---------------------------------------------------------------------------
// Code 2 — Resolve o pacote
// ALTERAÇÃO: trocar a origem dos itens de
//   $items("Code 1 - Extrai dados da query")
// para
//   $items("Code 1b - Enriquece itens com feriado")
// Propagar is_feriado sem recalcular.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Code 3 — Escolhe banda e preço
// Usar item.is_feriado (boolean) para aplicar pricing_tiers / includesHolidays
// / holidayPolicy — mesma regra do app. Não chamar a RPC novamente.
// ---------------------------------------------------------------------------
