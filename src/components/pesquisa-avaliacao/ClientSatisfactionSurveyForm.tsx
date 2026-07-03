import { FormEvent, useMemo, useState } from "react";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatIsoDateBR } from "@/lib/date";
import { formatBrazilPhone } from "@/lib/phone";
import {
  loadClientSatisfactionSurvey,
  useSubmitClientSatisfactionSurvey,
  type ClientSatisfactionSurveyConfig,
  type PublicSatisfactionQuestion,
} from "@/features/public-satisfaction-survey";
import { cn } from "@/lib/utils";

interface ClientSatisfactionSurveyFormProps {
  eventoId: number;
  tenantSlug: string;
}

const ScaleQuestion = ({
  onChange,
  question,
  value,
}: {
  onChange: (value: string) => void;
  question: PublicSatisfactionQuestion;
  value: string;
}) => {
  const min = typeof question.config.min === "number" ? question.config.min : 0;
  const max = typeof question.config.max === "number" ? question.config.max : 10;
  const options = Array.from({ length: max - min + 1 }, (_, index) => String(min + index));

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={value === option ? "default" : "outline"}
          className="min-w-10"
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
};

const ChoiceQuestion = ({
  onChange,
  question,
  value,
}: {
  onChange: (value: string) => void;
  question: PublicSatisfactionQuestion;
  value: string;
}) => {
  const options = Array.isArray(question.config.options)
    ? question.config.options.filter((option): option is string => typeof option === "string")
    : [];

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
            value === option
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border/60 hover:border-primary/30",
          )}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="h-4 w-4 accent-primary"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
};

export const ClientSatisfactionSurveyForm = ({
  eventoId,
  tenantSlug,
}: ClientSatisfactionSurveyFormProps) => {
  const submitSurvey = useSubmitClientSatisfactionSurvey();

  const [clientPhone, setClientPhone] = useState("");
  const [config, setConfig] = useState<ClientSatisfactionSurveyConfig | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const sortedQuestions = useMemo(
    () =>
      [...(config?.questions ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id),
      ),
    [config?.questions],
  );

  const handleVerifyPhone = async (event: FormEvent) => {
    event.preventDefault();
    setLoadError(null);
    setSubmitMessage(null);
    setIsLoadingSurvey(true);

    try {
      const loaded = await loadClientSatisfactionSurvey({
        clientPhone,
        eventoId,
        tenantSlug,
      });

      setConfig(loaded);
      setVerifiedPhone(clientPhone);
      setResponses(loaded.savedResponses ?? {});

      if (loaded.alreadySubmitted) {
        setSubmitMessage(loaded.message ?? "Esta pesquisa já foi respondida.");
      }
    } catch (error) {
      setConfig(null);
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a pesquisa.");
    } finally {
      setIsLoadingSurvey(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!config || config.alreadySubmitted) return;

    try {
      const result = await submitSurvey.mutateAsync({
        clientPhone: verifiedPhone,
        eventoId,
        responses,
        tenantSlug,
      });

      setSubmitMessage(result.message);
      setConfig((current) =>
        current
          ? {
              ...current,
              alreadySubmitted: true,
            }
          : current,
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível enviar a pesquisa.");
    }
  };

  if (!config) {
    return (
      <form onSubmit={(event) => void handleVerifyPhone(event)} className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Confirme seu telefone</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Informe o mesmo celular cadastrado na contratação da festa para abrir a pesquisa.
          </p>
          <div className="space-y-2">
            <Label htmlFor="survey-phone">Celular com DDD</Label>
            <Input
              id="survey-phone"
              value={clientPhone}
              onChange={(event) => setClientPhone(event.target.value)}
              placeholder="(45) 99999-9999"
              autoComplete="tel"
            />
          </div>
          {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
          <Button type="submit" disabled={isLoadingSurvey || clientPhone.trim().length < 8}>
            {isLoadingSurvey ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </form>
    );
  }

  if (config.alreadySubmitted || submitMessage) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center space-y-3">
        <Star className="mx-auto h-8 w-8 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Obrigado!</h2>
        <p className="text-sm text-muted-foreground">
          {submitMessage ?? config.message ?? "Sua avaliação foi registrada."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{config.tenantName}</p>
        <h2 className="text-xl font-semibold text-foreground">{config.title}</h2>
        <p className="text-sm text-muted-foreground">
          Olá, {config.clientName}. Conte como foi a festa
          {config.aniversarianteNome ? ` de ${config.aniversarianteNome}` : ""}
          {config.partyDate ? ` em ${formatIsoDateBR(config.partyDate)}` : ""}.
        </p>
      </div>

      <div className="space-y-5">
        {sortedQuestions.map((question, index) => (
          <div key={question.id} className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {index + 1}. {question.label}
                {question.required ? <span className="text-primary"> *</span> : null}
              </p>
            </div>

            {question.questionType === "scale" ? (
              <ScaleQuestion
                question={question}
                value={responses[question.id] ?? ""}
                onChange={(value) =>
                  setResponses((current) => ({ ...current, [question.id]: value }))
                }
              />
            ) : null}

            {question.questionType === "single_choice" ? (
              <ChoiceQuestion
                question={question}
                value={responses[question.id] ?? ""}
                onChange={(value) =>
                  setResponses((current) => ({ ...current, [question.id]: value }))
                }
              />
            ) : null}

            {question.questionType === "textarea" ? (
              <Textarea
                value={responses[question.id] ?? ""}
                onChange={(event) =>
                  setResponses((current) => ({ ...current, [question.id]: event.target.value }))
                }
                rows={3}
                placeholder="Escreva aqui..."
              />
            ) : null}
          </div>
        ))}
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        Telefone confirmado: {formatBrazilPhone(verifiedPhone)}
      </div>

      <Button type="submit" className="w-full" disabled={submitSurvey.isPending}>
        {submitSurvey.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar avaliação"
        )}
      </Button>
    </form>
  );
};
