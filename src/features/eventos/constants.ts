import {
  ExecutedStage,
  FunnelDefinition,
  PartyStage,
  SalesStage,
  StageDefinition,
} from "./types";

export const funnelTabs: FunnelDefinition[] = [
  { key: "vendas", label: "Vendas" },
  { key: "festa", label: "Festa" },
  { key: "executadas", label: "Executadas" },
];

export const salesStages: StageDefinition<SalesStage>[] = [
  { key: "contato_inicial", label: "Contato Inicial" },
  { key: "proposta_enviada", label: "Proposta Enviada" },
  { key: "negociacao", label: "Negociação" },
  { key: "visita_agendada", label: "Visita Agendada" },
  { key: "perdido", label: "Perdido" },
];

export const partyStages: StageDefinition<PartyStage>[] = [
  { key: "boas_vindas", label: "Boas Vindas" },
  { key: "planejamento", label: "Planejamento" },
  { key: "organizacao", label: "Organização" },
  { key: "festa_pronta", label: "Festa Pronta" },
];

export const executedStages: StageDefinition<ExecutedStage>[] = [
  { key: "aguardando_feedback", label: "Aguardando Feedback" },
  { key: "redes_sociais", label: "Redes Sociais" },
  { key: "oportunidade_futura", label: "Oportunidade Futura" },
];

export const stageMap = {
  vendas: salesStages,
  festa: partyStages,
  executadas: executedStages,
} as const;
