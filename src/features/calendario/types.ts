import { Tables } from "@/lib/supabase/database.types";
import { Evento } from "@/features/eventos";

export type DateStatus = "disponivel" | "reservado" | "bloqueado";

export type CalendarBlock = Tables<"calendar_blocks">;

export interface DayInfo {
  blockedManually: boolean;
  blockId: number | null;
  date: string;
  dayOfWeek: string;
  dayOfWeekIndex: number;
  events: Evento[];
  festas: Evento[];
  status: DateStatus;
  visitas: Evento[];
}
