import { useState, useMemo } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultChecklistConfig, generateEventChecklist, EventChecklistCategory } from "@/data/checklistConfig";

const EventChecklist = () => {
  const [checklist, setChecklist] = useState<EventChecklistCategory[]>(() =>
    generateEventChecklist(defaultChecklistConfig)
  );

  const toggleItem = (categoryId: string, itemId: string) => {
    setChecklist((prev) =>
      prev.map((cat) =>
        cat.categoryId === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            }
          : cat
      )
    );
  };

  const overallProgress = useMemo(() => {
    const allItems = checklist.flatMap((c) => c.items);
    if (allItems.length === 0) return 0;
    return Math.round((allItems.filter((i) => i.done).length / allItems.length) * 100);
  }, [checklist]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-festa-blue" />
          Checklist de Organização
        </CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={overallProgress} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {overallProgress}% concluído
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {checklist.map((cat) => {
          const doneCount = cat.items.filter((i) => i.done).length;
          const total = cat.items.length;
          const catProgress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          return (
            <div key={cat.categoryId}>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-sm font-semibold text-foreground">{cat.name}</h4>
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{total}
                </span>
                <div className="flex-1" />
                <span className="text-xs font-medium text-muted-foreground">{catProgress}%</span>
              </div>
              <Progress value={catProgress} className="h-1.5 mb-2" />
              <div className="space-y-1">
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(cat.categoryId, item.id)}
                    className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        item.done ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EventChecklist;
