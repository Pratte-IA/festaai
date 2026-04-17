import { useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import MiniCalendar from "@/components/MiniCalendar";
import DayDetailPanel from "@/components/DayDetailPanel";
import { DayInfo, getDayInfo } from "@/data/calendarAvailability";

const Calendario = () => {
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [, setRefresh] = useState(0);

  const handleSelectDay = useCallback((day: DayInfo) => {
    setSelectedDay(day);
  }, []);

  const handleUpdate = useCallback(() => {
    if (selectedDay) {
      setSelectedDay(getDayInfo(selectedDay.date));
    }
    setRefresh((r) => r + 1);
  }, [selectedDay]);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
        <p className="text-sm text-muted-foreground mt-1">Disponibilidade e organização de festas</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MiniCalendar onSelectDay={handleSelectDay} selectedDate={selectedDay?.date} />
        <DayDetailPanel day={selectedDay} onUpdate={handleUpdate} />
      </div>
    </AppLayout>
  );
};

export default Calendario;
