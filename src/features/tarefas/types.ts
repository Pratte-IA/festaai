import type { EventoTarefa } from "@/features/eventos/types";

export interface TenantTarefaEvento {
  id: number;
  cliente_nome: string;
  aniversariante_nome: string | null;
  data_evento: string | null;
}

export interface TenantTarefaListItem extends EventoTarefa {
  evento: TenantTarefaEvento | null;
  responsavelNome: string | null;
}

export type TarefaStatusFilter = "pendentes" | "concluidas" | "todas";
