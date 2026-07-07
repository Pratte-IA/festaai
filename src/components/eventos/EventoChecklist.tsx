import { CheckCircle2, Circle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Evento, shouldShowEventChecklist, useEventoChecklist } from "@/features/eventos";

interface EventoChecklistProps {
  evento: Evento;
}

export const EventoChecklist = ({ evento }: EventoChecklistProps) => {
  const readOnly = evento.etapa === "festa_pronta";
  const { checklist, isLoading, isSaving, overallProgress, toggleItem } = useEventoChecklist({
    evento,
    readOnly,
  });

  if (!shouldShowEventChecklist(evento.etapa)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground italic">Carregando checklist...</p>
        </CardContent>
      </Card>
    );
  }

  if (checklist.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground italic">
            Nenhum item de checklist configurado para este pacote.
          </p>
        </CardContent>
      </Card>
    );
  }

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
        {readOnly && (
          <p className="text-xs text-muted-foreground mt-2">
            Checklist concluido — evento em Festa Pronta.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {checklist.map((category) => {
          const doneCount = category.items.filter((item) => item.done).length;
          const total = category.items.length;
          const categoryProgress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          return (
            <div key={category.categoryId}>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-sm font-semibold text-foreground">{category.name}</h4>
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{total}
                </span>
                <div className="flex-1" />
                <span className="text-xs font-medium text-muted-foreground">{categoryProgress}%</span>
              </div>
              <Progress value={categoryProgress} className="h-1.5 mb-2" />
              <div className="space-y-1">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={readOnly || isSaving}
                    onClick={() => toggleItem(category.categoryId, item.id)}
                    className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:cursor-default disabled:opacity-80"
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
