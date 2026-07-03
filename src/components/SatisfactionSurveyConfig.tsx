import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CUSTOM_SATISFACTION_QUESTION_TYPES,
  SATISFACTION_SURVEY_COMPANY_PLACEHOLDER,
  formatSurveyOptionsAsLines,
  isSatisfactionSurveyChoiceType,
  parseSurveyOptionsFromLines,
  satisfactionSurveyQuestionTypeLabels,
  useCreateSatisfactionSurveyQuestion,
  useDeleteSatisfactionSurveyQuestion,
  useReorderSatisfactionSurveyQuestion,
  useTenantSatisfactionSurvey,
  useUpdateSatisfactionSurveyQuestion,
  type SatisfactionSurveyQuestion,
  type SatisfactionSurveyQuestionType,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

interface SatisfactionSurveyConfigProps {
  showSettingsHeader?: boolean;
}

const getChoiceOptions = (question: SatisfactionSurveyQuestion): string[] => {
  if (!isSatisfactionSurveyChoiceType(question.questionType)) return [];
  const config = question.config as { options?: string[] };
  return config.options ?? [];
};

const SurveyQuestionRow = ({
  canMoveDown,
  canMoveUp,
  index,
  isBusy,
  onDelete,
  onEdit,
  onMove,
  onToggleActive,
  onToggleRequired,
  question,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  index: number;
  isBusy?: boolean;
  onDelete: (question: SatisfactionSurveyQuestion) => void;
  onEdit: (question: SatisfactionSurveyQuestion) => void;
  onMove: (question: SatisfactionSurveyQuestion, direction: "down" | "up") => void;
  onToggleActive: (question: SatisfactionSurveyQuestion, active: boolean) => void;
  onToggleRequired: (question: SatisfactionSurveyQuestion, required: boolean) => void;
  question: SatisfactionSurveyQuestion;
}) => {
  const choiceOptions = getChoiceOptions(question);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/20 px-4 py-4 last:border-b-0",
        !question.active && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex shrink-0 flex-col gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canMoveUp || isBusy}
            onClick={() => onMove(question, "up")}
            aria-label="Mover pergunta para cima"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canMoveDown || isBusy}
            onClick={() => onMove(question, "down")}
            aria-label="Mover pergunta para baixo"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{index + 1}.</span>
            <p className="text-sm font-semibold text-foreground">{question.label}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{satisfactionSurveyQuestionTypeLabels[question.questionType]}</span>
            {question.required ? <span className="text-primary">Obrigatória</span> : <span>Opcional</span>}
          </div>

          {choiceOptions.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Opções: {choiceOptions.join(" / ")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={question.required}
              disabled={isBusy}
              onCheckedChange={(checked) => onToggleRequired(question, checked)}
            />
            Obrigatória
          </label>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={question.active}
              disabled={isBusy}
              onCheckedChange={(checked) => onToggleActive(question, checked)}
            />
            Ativa
          </label>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isBusy}
              onClick={() => onEdit(question)}
              aria-label={`Editar ${question.label}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={isBusy}
              onClick={() => onDelete(question)}
              aria-label={`Excluir ${question.label}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SatisfactionSurveyConfig = ({ showSettingsHeader = false }: SatisfactionSurveyConfigProps) => {
  const { data: questions = [], isLoading } = useTenantSatisfactionSurvey();
  const createQuestion = useCreateSatisfactionSurveyQuestion();
  const updateQuestion = useUpdateSatisfactionSurveyQuestion();
  const deleteQuestion = useDeleteSatisfactionSurveyQuestion();
  const reorderQuestion = useReorderSatisfactionSurveyQuestion();

  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SatisfactionSurveyQuestion | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<SatisfactionSurveyQuestionType>("textarea");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsText, setNewOptionsText] = useState("");

  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState<SatisfactionSurveyQuestionType>("textarea");
  const [editRequired, setEditRequired] = useState(false);
  const [editOptionsText, setEditOptionsText] = useState("");

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id)),
    [questions],
  );

  const activeCount = sortedQuestions.filter((question) => question.active).length;
  const requiredCount = sortedQuestions.filter((question) => question.required && question.active).length;

  const showNewOptions = isSatisfactionSurveyChoiceType(newType);
  const showEditOptions = isSatisfactionSurveyChoiceType(editType);

  const isMutating =
    createQuestion.isPending ||
    updateQuestion.isPending ||
    deleteQuestion.isPending ||
    reorderQuestion.isPending;

  const runQuestionAction = async (questionId: string, action: () => Promise<void>) => {
    setBusyQuestionId(questionId);
    try {
      await action();
    } catch {
      toast({ title: "Não foi possível atualizar a pergunta", variant: "destructive" });
    } finally {
      setBusyQuestionId(null);
    }
  };

  const openEditor = (question: SatisfactionSurveyQuestion) => {
    setEditingQuestion(question);
    setEditLabel(question.label);
    setEditType(question.questionType);
    setEditRequired(question.required);
    setEditOptionsText(formatSurveyOptionsAsLines(getChoiceOptions(question)));
    setEditorOpen(true);
  };

  const resetNewQuestionForm = () => {
    setNewLabel("");
    setNewType("textarea");
    setNewRequired(false);
    setNewOptionsText("");
  };

  const addQuestion = async () => {
    const label = newLabel.trim();
    if (!label) {
      toast({ title: "Informe o texto da pergunta", variant: "destructive" });
      return;
    }

    const options = showNewOptions ? parseSurveyOptionsFromLines(newOptionsText) : [];
    if (showNewOptions && options.length < 2) {
      toast({
        title: "Complete as opções de resposta",
        description: "Para escolha única, liste pelo menos duas opções — uma em cada linha.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createQuestion.mutateAsync({
        config: showNewOptions ? { options } : {},
        label,
        questionType: newType,
        required: newRequired,
      });
      toast({ title: "Pergunta adicionada" });
      resetNewQuestionForm();
    } catch {
      toast({ title: "Não foi possível adicionar a pergunta", variant: "destructive" });
    }
  };

  const saveEditedQuestion = async () => {
    if (!editingQuestion) return;

    const label = editLabel.trim();
    if (!label) {
      toast({ title: "Informe o texto da pergunta", variant: "destructive" });
      return;
    }

    const options = showEditOptions ? parseSurveyOptionsFromLines(editOptionsText) : [];
    if (showEditOptions && options.length < 2) {
      toast({
        title: "Complete as opções de resposta",
        description: "Para escolha única, liste pelo menos duas opções — uma em cada linha.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateQuestion.mutateAsync({
        config: showEditOptions ? { options } : {},
        label,
        questionId: editingQuestion.id,
        questionType: editType,
        required: editRequired,
      });
      toast({ title: "Pergunta atualizada" });
      setEditorOpen(false);
      setEditingQuestion(null);
    } catch {
      toast({ title: "Não foi possível salvar a pergunta", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando pesquisa de avaliação...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showSettingsHeader ? (
        <SettingsPageHeader
          title={SETTINGS_PAGE_META["pesquisa-avaliacao"].title}
          description={SETTINGS_PAGE_META["pesquisa-avaliacao"].description}
          stats={
            <>
              <SettingsStatChip>
                {sortedQuestions.length} pergunta{sortedQuestions.length === 1 ? "" : "s"}
              </SettingsStatChip>
              <SettingsStatChip>{activeCount} ativa{activeCount === 1 ? "" : "s"}</SettingsStatChip>
              <SettingsStatChip>
                {requiredCount} obrigatória{requiredCount === 1 ? "" : "s"}
              </SettingsStatChip>
            </>
          }
        />
      ) : null}

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Pesquisa de satisfação — Festa Infantil</p>
        <p className="mt-2">
          Este formulário é enviado após a festa para medir a satisfação das famílias. Use{" "}
          <code className="rounded bg-muted/60 px-1 py-0.5 text-xs">{SATISFACTION_SURVEY_COMPANY_PLACEHOLDER}</code>{" "}
          no texto para substituir automaticamente pelo nome da sua casa de festas.
        </p>
        <p className="mt-2">
          Recomendamos manter poucas perguntas obrigatórias — quanto mais rápido de responder, mais
          famílias preenchem.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40">
        {sortedQuestions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma pergunta cadastrada. Adicione abaixo ou restaure o modelo padrão pelo suporte.
          </div>
        ) : (
          sortedQuestions.map((question, index) => (
            <SurveyQuestionRow
              key={question.id}
              index={index}
              question={question}
              canMoveUp={index > 0}
              canMoveDown={index < sortedQuestions.length - 1}
              isBusy={busyQuestionId === question.id || isMutating}
              onEdit={openEditor}
              onDelete={(item) => {
                void runQuestionAction(item.id, async () => {
                  await deleteQuestion.mutateAsync(item.id);
                  toast({ title: "Pergunta excluída" });
                });
              }}
              onMove={(item, direction) => {
                void runQuestionAction(item.id, () =>
                  reorderQuestion.mutateAsync({ direction, questionId: item.id }),
                );
              }}
              onToggleActive={(item, active) => {
                void runQuestionAction(item.id, () =>
                  updateQuestion.mutateAsync({ active, questionId: item.id }),
                );
              }}
              onToggleRequired={(item, required) => {
                void runQuestionAction(item.id, () =>
                  updateQuestion.mutateAsync({ questionId: item.id, required }),
                );
              }}
            />
          ))
        )}
      </div>

      <div className="rounded-xl border border-primary/30 bg-card/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-base font-semibold text-foreground">Nova pergunta</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="new-survey-label">Texto da pergunta</Label>
            <Textarea
              id="new-survey-label"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder={`Ex.: O que faria você dizer que essa foi uma festa perfeita na ${SATISFACTION_SURVEY_COMPANY_PLACEHOLDER}?`}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de resposta</Label>
            <Select
              value={newType}
              onValueChange={(value) => setNewType(value as SatisfactionSurveyQuestionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOM_SATISFACTION_QUESTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {satisfactionSurveyQuestionTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={newRequired} onCheckedChange={setNewRequired} />
              Pergunta obrigatória
            </label>
          </div>

          {showNewOptions ? (
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="new-survey-options">Opções (uma por linha)</Label>
              <Textarea
                id="new-survey-options"
                value={newOptionsText}
                onChange={(event) => setNewOptionsText(event.target.value)}
                placeholder={"Sim\nNão\nTalvez"}
                rows={4}
              />
            </div>
          ) : null}
        </div>

        <Button type="button" onClick={() => void addQuestion()} disabled={isMutating}>
          Adicionar pergunta
        </Button>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar pergunta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-survey-label">Texto da pergunta</Label>
              <Textarea
                id="edit-survey-label"
                value={editLabel}
                onChange={(event) => setEditLabel(event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de resposta</Label>
              <Select
                value={editType}
                onValueChange={(value) => setEditType(value as SatisfactionSurveyQuestionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(satisfactionSurveyQuestionTypeLabels) as SatisfactionSurveyQuestionType[]).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {satisfactionSurveyQuestionTypeLabels[type]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={editRequired} onCheckedChange={setEditRequired} />
              Pergunta obrigatória
            </label>

            {showEditOptions ? (
              <div className="space-y-2">
                <Label htmlFor="edit-survey-options">Opções (uma por linha)</Label>
                <Textarea
                  id="edit-survey-options"
                  value={editOptionsText}
                  onChange={(event) => setEditOptionsText(event.target.value)}
                  rows={4}
                />
              </div>
            ) : null}

            {editType === "scale" ? (
              <p className="text-xs text-muted-foreground">Escala fixa de 0 a 10 (NPS).</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveEditedQuestion()} disabled={isMutating}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SatisfactionSurveyConfig;
