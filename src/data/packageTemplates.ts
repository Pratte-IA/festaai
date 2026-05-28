// Modelos padrão sugeridos para acelerar a criação de pacotes

export const buffetTemplates = {
  basico: {
    salgados: ["Coxinha", "Bolinha de queijo", "Mini pizza"],
    doces: ["Brigadeiro", "Beijinho"],
    bolo: ["Bolo decorado"],
    bebidas: ["Suco natural", "Refrigerante", "Água"],
  },
  completo: {
    salgados: ["Coxinha", "Bolinha de queijo", "Mini pizza", "Empada", "Enroladinho"],
    doces: ["Brigadeiro", "Beijinho", "Cajuzinho", "Cupcakes"],
    bolo: ["Bolo temático"],
    bebidas: ["Suco natural", "Refrigerante", "Água", "Chá gelado"],
  },
  gourmet: {
    salgados: ["Coxinha gourmet", "Bolinha de queijo", "Mini pizza artesanal", "Empada de camarão", "Mini hambúrguer"],
    doces: ["Brigadeiro gourmet", "Beijinho", "Mesa de doces completa"],
    bolo: ["Bolo designer"],
    bebidas: ["Suco natural premium", "Refrigerante", "Água com gás", "Drinks kids"],
  },
};

export const estruturaTemplates = {
  basico: {
    brinquedos: ["Piscina de bolinhas", "Cama elástica"],
    espaco: ["Salão principal (4h)"],
    decoracao: ["Decoração simples com balões"],
  },
  completo: {
    brinquedos: ["Piscina de bolinhas", "Cama elástica", "Tobogã inflável", "Oficina de slime"],
    espaco: ["Salão principal (5h)", "Área externa"],
    decoracao: ["Decoração temática completa", "Painel de fotos"],
  },
  premium: {
    brinquedos: ["Piscina de bolinhas", "Cama elástica", "Tobogã inflável", "Oficina de slime", "Just Dance", "Karaokê"],
    espaco: ["Salão principal (6h)", "Área externa", "Espaço lounge pais"],
    decoracao: ["Decoração luxo personalizada", "Painel de fotos", "Balões orgânicos", "Iluminação cênica"],
  },
};

// Sugestões para autocomplete
export const itemSuggestions = {
  salgados: ["Coxinha", "Bolinha de queijo", "Mini pizza", "Empada", "Enroladinho", "Mini hambúrguer", "Esfiha", "Pastel", "Quibe", "Risole"],
  doces: ["Brigadeiro", "Beijinho", "Cajuzinho", "Cupcakes", "Mesa de doces", "Brownie", "Pirulito", "Fios de ovos", "Casadinho"],
  bolo: ["Bolo decorado", "Bolo temático", "Bolo personalizado", "Bolo de chocolate", "Bolo de morango", "Naked cake", "Bolo fake", "Topo personalizado"],
  bebidas: ["Suco natural", "Refrigerante", "Água", "Chá gelado", "Drinks kids", "Água com gás", "Água saborizada"],
  brinquedos: ["Piscina de bolinhas", "Cama elástica", "Tobogã inflável", "Oficina de slime", "Just Dance", "Karaokê", "Pula-pula", "Escorregador", "Mesa de jogos"],
  espaco: ["Salão principal (4h)", "Salão principal (5h)", "Salão principal (6h)", "Área externa", "Espaço lounge pais", "Área kids", "Camarim"],
  decoracao: ["Decoração simples com balões", "Decoração temática completa", "Painel de fotos", "Balões orgânicos", "Iluminação cênica", "Mesa do bolo decorada", "Backdrop personalizado"],
};
