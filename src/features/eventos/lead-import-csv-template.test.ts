import { describe, expect, it } from "vitest";

import {
  buildLeadImportCsvTemplate,
  getLeadImportCsvFilename,
  LEAD_IMPORT_CSV_HEADERS,
} from "./lead-import-csv-template";
import { parseLeadImportCsv, resolveTipoEventoCell } from "./parse-leads-csv";

describe("buildLeadImportCsvTemplate", () => {
  it("inclui todas as colunas do formulario de evento", () => {
    expect(LEAD_IMPORT_CSV_HEADERS).toEqual([
      "funil",
      "etapa",
      "nome",
      "telefone",
      "email",
      "origem",
      "tipo_evento",
      "data_evento",
      "hora",
      "aniversariante",
      "nascimento",
      "convidados",
      "pacote_nome",
      "valor_pacote",
      "valor_adicionais",
      "valor_entrada",
      "observacoes",
    ]);
  });

  it("preenche funil e primeira etapa do contexto", () => {
    const csv = buildLeadImportCsvTemplate("festa");
    const [headerLine, exampleLine] = csv.split("\n");
    expect(headerLine).toContain("funil,etapa,nome");
    expect(exampleLine.startsWith("festa,boas_vindas,")).toBe(true);
  });

  it("gera nome de arquivo por funil", () => {
    expect(getLeadImportCsvFilename("vendas")).toBe("modelo-importacao-vendas.csv");
  });
});

describe("resolveTipoEventoCell", () => {
  it("padrao festa quando vazio", () => {
    expect(resolveTipoEventoCell("")).toEqual({ tipo_evento: "festa" });
  });

  it("aceita visita", () => {
    expect(resolveTipoEventoCell("visita")).toEqual({ tipo_evento: "visita" });
  });

  it("rejeita valor invalido", () => {
    expect(resolveTipoEventoCell("corporativo") && "error" in resolveTipoEventoCell("corporativo")).toBe(true);
  });
});

describe("parseLeadImportCsv tipo_evento", () => {
  it("importa tipo visita quando informado", () => {
    const csv = "funil,etapa,nome,tipo_evento\nvendas,contato_inicial,Ana,visita\n";
    const result = parseLeadImportCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].tipo_evento).toBe("visita");
  });

  it("usa festa quando coluna ausente", () => {
    const csv = "funil,etapa,nome\nvendas,contato_inicial,Ana\n";
    const result = parseLeadImportCsv(csv);
    expect(result.rows[0].tipo_evento).toBe("festa");
  });
});
