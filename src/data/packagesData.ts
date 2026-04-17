export interface BuffetBlock {
  salgados: string[];
  doces: string[];
  bebidas: string[];
}

export interface EstruturaBlock {
  brinquedos: string[];
  espaco: string[];
  decoracao: string[];
}

export interface EquipeBlock {
  garcom: number;
  monitora: number;
  limpeza: number;
}

export interface PricingTier {
  id: string;
  minGuests: number;
  maxGuests: number;
  weekdayPrice: number;
  weekendPrice: number;
}

export interface PackageData {
  id: string;
  name: string;
  description: string;
  buffet: BuffetBlock;
  estrutura: EstruturaBlock;
  equipe: EquipeBlock;
  pricingTiers: PricingTier[];
}

export interface Additional {
  id: string;
  name: string;
  price: number;
  category: "buffet" | "estrutura" | "equipe" | "entretenimento" | "outros";
  type: "fixo" | "por_unidade";
}

export const defaultPackages: PackageData[] = [
  {
    id: "1",
    name: "Pacote Básico",
    description:
      "Ideal para festas íntimas com tudo que seu filho merece. Diversão garantida em um ambiente seguro e decorado com carinho.",
    buffet: {
      salgados: ["Coxinha", "Bolinha de queijo", "Mini pizza"],
      doces: ["Brigadeiro", "Beijinho", "Bolo decorado"],
      bebidas: ["Suco natural", "Refrigerante", "Água"],
    },
    estrutura: {
      brinquedos: ["Piscina de bolinhas", "Cama elástica"],
      espaco: ["Salão principal (4h)"],
      decoracao: ["Decoração simples com balões"],
    },
    equipe: { garcom: 1, monitora: 1, limpeza: 1 },
    pricingTiers: [
      { id: "p1-t1", minGuests: 1, maxGuests: 20, weekdayPrice: 2500, weekendPrice: 3200 },
      { id: "p1-t2", minGuests: 21, maxGuests: 40, weekdayPrice: 3500, weekendPrice: 4400 },
    ],
  },
  {
    id: "2",
    name: "Pacote Premium",
    description:
      "A festa completa para quem quer surpreender! Buffet temático, equipe dedicada e diversão de sobra para todas as idades.",
    buffet: {
      salgados: ["Coxinha", "Bolinha de queijo", "Mini pizza", "Empada", "Enroladinho"],
      doces: ["Brigadeiro", "Beijinho", "Cajuzinho", "Bolo temático", "Cupcakes"],
      bebidas: ["Suco natural", "Refrigerante", "Água", "Chá gelado"],
    },
    estrutura: {
      brinquedos: ["Piscina de bolinhas", "Cama elástica", "Tobogã inflável", "Oficina de slime"],
      espaco: ["Salão principal (5h)", "Área externa"],
      decoracao: ["Decoração temática completa", "Painel de fotos"],
    },
    equipe: { garcom: 2, monitora: 2, limpeza: 1 },
    pricingTiers: [
      { id: "p2-t1", minGuests: 1, maxGuests: 30, weekdayPrice: 4500, weekendPrice: 5500 },
      { id: "p2-t2", minGuests: 31, maxGuests: 50, weekdayPrice: 5800, weekendPrice: 6900 },
      { id: "p2-t3", minGuests: 51, maxGuests: 70, weekdayPrice: 7000, weekendPrice: 8200 },
    ],
  },
  {
    id: "3",
    name: "Pacote VIP",
    description:
      "A experiência premium para festas inesquecíveis. Tudo incluso: buffet gourmet, entretenimento profissional, fotografia e muito mais.",
    buffet: {
      salgados: ["Coxinha gourmet", "Bolinha de queijo", "Mini pizza artesanal", "Empada de camarão", "Enroladinho", "Mini hambúrguer"],
      doces: ["Brigadeiro gourmet", "Beijinho", "Cajuzinho", "Bolo designer", "Cupcakes decorados", "Mesa de doces completa"],
      bebidas: ["Suco natural premium", "Refrigerante", "Água com gás", "Chá gelado", "Drinks kids"],
    },
    estrutura: {
      brinquedos: ["Piscina de bolinhas", "Cama elástica", "Tobogã inflável", "Oficina de slime", "Just Dance", "Karaokê"],
      espaco: ["Salão principal (6h)", "Área externa", "Espaço lounge pais"],
      decoracao: ["Decoração luxo personalizada", "Painel de fotos", "Balões orgânicos", "Iluminação cênica"],
    },
    equipe: { garcom: 3, monitora: 3, limpeza: 2 },
    pricingTiers: [
      { id: "p3-t1", minGuests: 1, maxGuests: 40, weekdayPrice: 7000, weekendPrice: 8500 },
      { id: "p3-t2", minGuests: 41, maxGuests: 70, weekdayPrice: 9000, weekendPrice: 10800 },
      { id: "p3-t3", minGuests: 71, maxGuests: 100, weekdayPrice: 11500, weekendPrice: 13500 },
    ],
  },
];

export const defaultAdditionals: Additional[] = [
  { id: "a1", name: "Convidado extra", price: 80, category: "outros", type: "por_unidade" },
  { id: "a2", name: "Hora extra", price: 500, category: "estrutura", type: "por_unidade" },
  { id: "a3", name: "Fotógrafo profissional", price: 800, category: "entretenimento", type: "fixo" },
  { id: "a4", name: "DJ", price: 600, category: "entretenimento", type: "fixo" },
  { id: "a5", name: "Personagem vivo", price: 450, category: "entretenimento", type: "fixo" },
  { id: "a6", name: "Algodão doce", price: 350, category: "buffet", type: "fixo" },
  { id: "a7", name: "Pipoca gourmet", price: 250, category: "buffet", type: "fixo" },
  { id: "a8", name: "Monitor extra", price: 200, category: "equipe", type: "por_unidade" },
  { id: "a9", name: "Garçom extra", price: 180, category: "equipe", type: "por_unidade" },
  { id: "a10", name: "Pintura facial", price: 300, category: "entretenimento", type: "fixo" },
];
