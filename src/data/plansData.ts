export type SetupType = "avista" | "parcelado";

export interface CommercialPlan {
  id: string;
  nome: string;
  setupTipo: SetupType;
  setupValor: number;
  setupParcelas?: number | null;
  mensalidadeValor: number;
  fidelidadeMeses?: number | null;
  ativo: boolean;
}

export const defaultPlans: CommercialPlan[] = [
  {
    id: "p1",
    nome: "Starter",
    setupTipo: "avista",
    setupValor: 1500,
    setupParcelas: null,
    mensalidadeValor: 199,
    fidelidadeMeses: null,
    ativo: true,
  },
  {
    id: "p2",
    nome: "Profissional",
    setupTipo: "parcelado",
    setupValor: 3000,
    setupParcelas: 3,
    mensalidadeValor: 349,
    fidelidadeMeses: 12,
    ativo: true,
  },
  {
    id: "p3",
    nome: "Enterprise",
    setupTipo: "parcelado",
    setupValor: 6000,
    setupParcelas: 6,
    mensalidadeValor: 599,
    fidelidadeMeses: 12,
    ativo: true,
  },
];
