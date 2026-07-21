import { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

import type { EventoContractSignatureFollowupSummary } from "./contract-signature-followup";

export type FunnelType = "vendas" | "festa" | "executadas";
export type EventType = "festa" | "visita";

export interface ChecklistExtraItem {
  id: string;
  label: string;
}

export type SalesStage =
  | "contato_inicial"
  | "proposta_enviada"
  | "negociacao"
  | "visita_agendada"
  | "perdido";

export type PartyStage =
  | "boas_vindas"
  | "planejamento"
  | "festa_pronta";

export type ExecutedStage =
  | "aguardando_feedback"
  | "redes_sociais"
  | "oportunidade_futura";

export type Stage = SalesStage | PartyStage | ExecutedStage;
export type InternalStatus = "novo" | "ativo" | "pendente" | "finalizado" | "perdido" | "cancelado";

export type Evento = Omit<
  Tables<"eventos">,
  "etapa" | "funil" | "status_interno" | "tipo_evento" | "checklist_concluidos" | "checklist_extras"
> & {
  contract_signature_followup?: EventoContractSignatureFollowupSummary | null;
  etapa: Stage;
  funil: FunnelType;
  status_interno: InternalStatus;
  tipo_evento: EventType;
  checklist_concluidos: string[];
  checklist_extras: ChecklistExtraItem[];
};

export type EventoInsert = Omit<
  TablesInsert<"eventos">,
  "etapa" | "funil" | "status_interno" | "tipo_evento" | "checklist_concluidos" | "checklist_extras"
> & {
  etapa?: Stage;
  funil?: FunnelType;
  status_interno?: InternalStatus;
  tipo_evento?: EventType;
  checklist_concluidos?: string[];
  checklist_extras?: ChecklistExtraItem[];
};

export type EventoUpdate = Omit<
  TablesUpdate<"eventos">,
  "etapa" | "funil" | "status_interno" | "tipo_evento" | "checklist_concluidos" | "checklist_extras"
> & {
  etapa?: Stage;
  funil?: FunnelType;
  status_interno?: InternalStatus;
  tipo_evento?: EventType;
  checklist_concluidos?: string[];
  checklist_extras?: ChecklistExtraItem[];
};

export type EventoPagamento = Tables<"evento_pagamentos">;
export type EventoPagamentoInsert = TablesInsert<"evento_pagamentos">;
export type EventoPagamentoUpdate = TablesUpdate<"evento_pagamentos">;

export type EventoTarefa = Tables<"evento_tarefas">;
export type EventoTarefaInsert = TablesInsert<"evento_tarefas">;
export type EventoTarefaUpdate = TablesUpdate<"evento_tarefas">;

export type EventoNota = Tables<"evento_notas">;
export type EventoNotaInsert = TablesInsert<"evento_notas">;
export type EventoNotaUpdate = TablesUpdate<"evento_notas">;

export interface StageDefinition<TStage extends Stage = Stage> {
  key: TStage;
  label: string;
}

export interface FunnelDefinition {
  key: FunnelType;
  label: string;
}
