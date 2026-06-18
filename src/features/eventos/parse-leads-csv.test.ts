import { describe, expect, it } from "vitest";

import {
  normalizeHeaderKey,
  parseCsvRow,
  parseDateFlexible,
  parseLeadImportCsv,
  parseMoneyFlexible,
  resolveEtapaCell,
  resolveFunilCell,
  stripUtf8Bom,
} from "./parse-leads-csv";

describe("stripUtf8Bom", () => {
  it("remove BOM inicial", () => {
    expect(stripUtf8Bom("\ufeffnome,telefone\nJoao,")).toBe("nome,telefone\nJoao,");
  });
});

describe("parseCsvRow", () => {
  it("separa celulas simples", () => {
    expect(parseCsvRow("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("respeita aspas e escapes", () => {
    expect(parseCsvRow('"Maria, Silva",1199,"Obs, com virgula"')).toEqual([
      "Maria, Silva",
      "1199",
      "Obs, com virgula",
    ]);
  });
});

describe("parseDateFlexible", () => {
  it("interpreta formato BR", () => {
    expect(parseDateFlexible("5/12/2026")).toEqual({ iso: "2026-12-05" });
  });

  it("mantem ISO", () => {
    expect(parseDateFlexible("2026-03-09")).toEqual({ iso: "2026-03-09" });
  });

  it("rejeita lixo", () => {
    expect(parseDateFlexible("proxima semana")).toBeNull();
  });
});

describe("parseMoneyFlexible", () => {
  it("aceita inteiro BR", () => {
    expect(parseMoneyFlexible("1.234,50")).toBe(1234.5);
  });

  it("aceita ponto americano", () => {
    expect(parseMoneyFlexible("99.99")).toBe(99.99);
  });

  it("vazio eh null", () => {
    expect(parseMoneyFlexible("   ")).toBeNull();
  });
});

describe("normalizeHeaderKey", () => {
  it("normaliza texto com acento e espacos", () => {
    expect(normalizeHeaderKey("Nome do Cliente ")).toBe("nome_do_cliente");
  });
});

describe("resolveFunilCell", () => {
  it("resolve chave tecnica", () => {
    expect(resolveFunilCell("festa")).toEqual({ funil: "festa" });
  });

  it("resolve rotulo em portugues", () => {
    const hit = resolveFunilCell("Vendas");
    expect(hit && "funil" in hit && hit.funil).toBe("vendas");
  });

  it("valor vazio", () => {
    expect(resolveFunilCell("")).toBeNull();
    expect(resolveFunilCell("  ")).toBeNull();
  });
});

describe("resolveEtapaCell", () => {
  it("resolve por nome amigavel", () => {
    const r = resolveEtapaCell("Proposta enviada", "vendas");
    expect(r).toEqual({ etapa: "proposta_enviada" });
  });

  it("rejeita etapa de outro funil", () => {
    const r = resolveEtapaCell("contato_inicial", "festa");
    expect(r && "error" in r).toBe(true);
  });
});

describe("parseLeadImportCsv", () => {
  it("detecta erro sem coluna cliente", () => {
    const r = parseLeadImportCsv("funil,etapa,telefone\nvendas,contato_inicial,1199");
    expect(r.rows.length).toBe(0);
    expect(r.issues.some((x) => x.message.includes("nome do cliente"))).toBe(true);
  });

  it("detecta erro sem coluna funil", () => {
    const r = parseLeadImportCsv("etapa,nome\ncontato_inicial,Jose");
    expect(r.rows.length).toBe(0);
    expect(r.issues.some((x) => x.message.includes("funil"))).toBe(true);
  });

  it("detecta erro sem coluna etapa", () => {
    const r = parseLeadImportCsv("funil,nome\nvendas,Jose");
    expect(r.rows.length).toBe(0);
    expect(r.issues.some((x) => x.message.includes("etapa"))).toBe(true);
  });

  it("monta dois leads validos (funil vendas)", () => {
    const csv = stripUtf8Bom(
      "funil,etapa,Nome,Telefone,Email,data festa,valor pacote\n" +
        "vendas,contato_inicial,Ana Lima,11888887777,,12/06/2026,\n" +
        "vendas,negociacao,Bob,,bob@test.com,,1500\n",
    );
    const r = parseLeadImportCsv(csv);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].cliente_nome).toBe("Ana Lima");
    expect(r.rows[0].data_evento).toBe("2026-06-12");
    expect(r.rows[1].valor_pacote).toBe(1500);
    expect(r.rows[0].funil).toBe("vendas");
    expect(r.rows[0].etapa).toBe("contato_inicial");
    expect(r.rows[1].etapa).toBe("negociacao");
  });

  it("permitir funil festa por coluna por linha", () => {
    const csv = stripUtf8Bom("funil,etapa,Nome\nfesta,contrato,Joao Silva\n");
    const r = parseLeadImportCsv(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].funil).toBe("festa");
    expect(r.rows[0].etapa).toBe("contrato");
  });

  it("primeira etapa do funil se celula etapa vazia", () => {
    const csv = stripUtf8Bom("funil,etapa,Nome\nvendas,,Lucia Costa\n");
    const r = parseLeadImportCsv(csv);
    expect(r.rows[0].etapa).toBe("contato_inicial");
  });

  it("usa coluna etapa por linha", () => {
    const csv = stripUtf8Bom("funil,etapa,nome\nvendas,negociacao,Maria\nvendas,,Joao\n");
    const r = parseLeadImportCsv(csv);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].etapa).toBe("negociacao");
    expect(r.rows[1].etapa).toBe("contato_inicial");
  });

  it("status interno perdido quando etapa eh perdido", () => {
    const csv = stripUtf8Bom("funil,etapa,nome\nvendas,perdido,Maria\n");
    const r = parseLeadImportCsv(csv);
    expect(r.rows[0].status_interno).toBe("perdido");
  });

  it("importa data de nascimento do aniversariante", () => {
    const csv = stripUtf8Bom("funil,etapa,nome,aniversariante,nascimento\nvendas,contato_inicial,Ana,Julia,12/03/2019\n");
    const r = parseLeadImportCsv(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].aniversariante_nome).toBe("Julia");
    expect(r.rows[0].aniversariante_data_nascimento).toBe("2019-03-12");
  });

  it("migra etapa fechado para funil festa na importacao", () => {
    const csv = stripUtf8Bom("funil,etapa,nome\nvendas,fechado,Maria\n");
    const r = parseLeadImportCsv(csv);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].funil).toBe("festa");
    expect(r.rows[0].etapa).toBe("boas_vindas");
  });
});
