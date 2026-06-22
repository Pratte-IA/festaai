import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayInfo, formatDateKey, useCalendarDays } from "@/features/calendario";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

interface MiniCalendarProps {
  onSelectDay?: (day: DayInfo) => void;
  selectedDate?: string | null;
}

const MiniCalendar = ({ onSelectDay, selectedDate }: MiniCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  const todayStr = formatDateKey(today);
  const { data, error, isLoading } = useCalendarDays(year, month);
  const monthDays = data?.days ?? [];

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getStatusClasses = (day: DayInfo, isToday: boolean, isSelected: boolean) => {
    if (isSelected) return "bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-2 ring-offset-card";
    if (isToday) return "bg-primary text-primary-foreground font-bold";
    if (day.status === "reservado") return "bg-rosa/20 text-rosa font-medium hover:bg-rosa/30";
    if (day.status === "bloqueado") return "bg-destructive/15 text-destructive font-medium hover:bg-destructive/25";
    if (day.visitas.length > 0) return "bg-accent text-accent-foreground font-medium hover:bg-accent/80";
    return "text-muted-foreground hover:bg-muted";
  };

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Calendário de Festas</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs font-medium text-muted-foreground min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}
        {isLoading &&
          Array.from({ length: 14 }).map((_, i) => (
            <div key={`loading-${i}`} className="h-9 animate-pulse rounded-md bg-muted/40" />
          ))}
        {error && (
          <div className="col-span-7 rounded-md bg-destructive/10 p-3 text-center text-xs text-destructive">
            Nao foi possivel carregar o calendario.
          </div>
        )}
        {monthDays.map((day) => {
          const dayNum = parseInt(day.date.split("-")[2]);
          const isToday = day.date === todayStr;
          const isSelected = day.date === selectedDate;
          const hasFesta = day.festas.length > 0;
          const hasVisita = day.visitas.length > 0;

          return (
            <button
              key={day.date}
              onClick={() => onSelectDay?.(day)}
              className={`h-9 flex flex-col items-center justify-center rounded-md text-xs relative cursor-pointer transition-all ${getStatusClasses(day, isToday, isSelected)}`}
            >
              {dayNum}
              {!isToday && !isSelected && (hasFesta || hasVisita || day.status === "bloqueado") && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {hasFesta && <div className="w-1 h-1 rounded-full bg-rosa" />}
                  {hasVisita && <div className="w-1 h-1 rounded-full bg-primary" />}
                  {day.status === "bloqueado" && <div className="w-1 h-1 rounded-full bg-destructive" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" /> Hoje
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-rosa" /> Festa fechada
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" /> Visita
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-destructive" /> Bloqueado
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-muted" /> Disponível
        </span>
      </div>
    </div>
  );
};

export default MiniCalendar;
