import type { Evento } from "@/features/eventos";
import { salesStages } from "@/features/eventos";

import { isInComercialFollowupPipeline } from "./festa-ai-daily-status";

export interface ComercialFollowupOpenRow {
  aniversarianteNome: string;
  clienteNome: string;
  dataFesta: string | null;
  etapa: string;
  etapaLabel: string;
  eventoId: number;
  followLabel: string;
}

const stageLabelByKey = new Map(salesStages.map((stage) => [stage.key, stage.label]));

/** Qual follow-up o FestaAI está trabalhando neste lead da esteira comercial. */
export const getComercialFollowupOpenLabel = (evento: Evento): string => {
  if (evento.etapa === "contato_inicial") {
    if (evento.followup_0_enviado_em) {
      if (!evento.contato_inicial_ultima_mensagem_em) {
        return "FU0 enviado";
      }
      return "Aguardando FU0b";
    }
    return "Aguardando FU0";
  }

  if (evento.etapa === "proposta_enviada") {
    if (evento.followup_status === "pausado_resposta") {
      return "Cliente respondeu (pausado)";
    }
    if (evento.followup_3_enviado_em) {
      return "FU3 enviado — aguardando FU4";
    }
    if (evento.followup_2_enviado_em) {
      return "FU2 enviado — aguardando FU3";
    }
    if (evento.followup_1_enviado_em) {
      return "FU1 enviado — aguardando FU2";
    }
    return "Aguardando FU1";
  }

  return "Follow-up comercial";
};

export const buildComercialFollowupOpenReport = (events: Evento[]): ComercialFollowupOpenRow[] =>
  events
    .filter(isInComercialFollowupPipeline)
    .map((evento) => ({
      aniversarianteNome: evento.aniversariante_nome?.trim() || "—",
      clienteNome: evento.cliente_nome,
      dataFesta: evento.data_evento,
      etapa: evento.etapa,
      etapaLabel: stageLabelByKey.get(evento.etapa as (typeof salesStages)[number]["key"]) ?? evento.etapa,
      eventoId: evento.id,
      followLabel: getComercialFollowupOpenLabel(evento),
    }))
    .sort((left, right) => {
      const etapaOrder =
        (left.etapa === "contato_inicial" ? 0 : 1) - (right.etapa === "contato_inicial" ? 0 : 1);
      if (etapaOrder !== 0) return etapaOrder;

      const leftDate = left.dataFesta ?? "9999-99-99";
      const rightDate = right.dataFesta ?? "9999-99-99";
      const byDate = leftDate.localeCompare(rightDate);
      if (byDate !== 0) return byDate;

      return left.clienteNome.localeCompare(right.clienteNome, "pt-BR");
    });
