import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Evento,
  ITENS_EXTRAS_CHECKLIST_CATEGORY_ID,
  shouldShowEventChecklist,
  useEventoChecklist,
} from "@/features/eventos";

interface EventoChecklistProps {
  evento: Evento;
}

export const EventoChecklist = ({ evento }: EventoChecklistProps) => {
  const readOnly = evento.etapa === "festa_pronta";
  const {
    addExtraItem,
    checklist,
    isLoading,
    isSaving,
    overallProgress,
    removeExtraItem,
    toggleItem,
  } = useEventoChecklist({
    evento,
    readOnly,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extraLabel, setExtraLabel] = useState("");

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

  const handleOpenAddDialog = () => {
    setExtraLabel("");
    setDialogOpen(true);
  };

  const handleConfirmAdd = () => {
    if (!addExtraItem(extraLabel)) {
      return;
    }
    setDialogOpen(false);
    setExtraLabel("");
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-festa-blue" />
              Checklist de Organização
            </CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={handleOpenAddDialog}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" aria-hidden />
                Adicionar item checklist
              </Button>
            )}
          </div>
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
            const isExtrasCategory = category.categoryId === ITENS_EXTRAS_CHECKLIST_CATEGORY_ID;

            return (
              <div key={category.categoryId}>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-sm font-semibold text-foreground">{category.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {doneCount}/{total}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {categoryProgress}%
                  </span>
                </div>
                <Progress value={categoryProgress} className="h-1.5 mb-2" />
                <div className="space-y-1">
                  {category.items.length === 0 && isExtrasCategory ? (
                    <p className="text-sm text-muted-foreground italic px-2 py-1">
                      Nenhum item extra nesta festa.
                    </p>
                  ) : null}
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={readOnly || isSaving}
                        onClick={() => toggleItem(category.categoryId, item.id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:cursor-default disabled:opacity-80"
                      >
                        {item.done ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                        )}
                        <span
                          className={`text-sm truncate ${
                            item.done ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                      {isExtrasCategory && !readOnly ? (
                        <button
                          type="button"
                          disabled={isSaving}
                          aria-label={`Remover ${item.label}`}
                          onClick={() => removeExtraItem(item.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar item checklist</DialogTitle>
            <DialogDescription>
              O item será incluído na categoria Itens Extras desta festa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="checklist-extra-label">Item extra</Label>
            <Input
              id="checklist-extra-label"
              value={extraLabel}
              placeholder="Ex.: Confirmar food truck"
              autoFocus
              onChange={(event) => setExtraLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleConfirmAdd();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!extraLabel.trim() || isSaving}
              onClick={handleConfirmAdd}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
