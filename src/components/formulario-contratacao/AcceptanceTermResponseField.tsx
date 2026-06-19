import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  isImageUsageChoiceTerm,
  type AcceptanceTermResponses,
} from "@/features/configuracoes/acceptance-term-response";
import { cn } from "@/lib/utils";

export interface AcceptanceTermFieldModel {
  content: string;
  id: string;
  isRequired: boolean;
  termKey: string | null;
  title: string;
}

interface AcceptanceTermResponseFieldProps {
  error?: string;
  onResponseChange: (termId: string, accepted: boolean) => void;
  response: boolean | undefined;
  term: AcceptanceTermFieldModel;
}

export const AcceptanceTermResponseField = ({
  error,
  onResponseChange,
  response,
  term,
}: AcceptanceTermResponseFieldProps) => {
  if (isImageUsageChoiceTerm(term)) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {term.title}
            <span className="text-destructive ml-1">*</span>
          </p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{term.content}</p>
        </div>

        <RadioGroup
          value={response === undefined ? undefined : response ? "authorize" : "decline"}
          onValueChange={(value) => onResponseChange(term.id, value === "authorize")}
          className="grid gap-2 sm:grid-cols-2"
        >
          <label
            htmlFor={`term-${term.id}-authorize`}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
              response === true ? "border-primary bg-primary/5" : "border-border/60",
            )}
          >
            <RadioGroupItem value="authorize" id={`term-${term.id}-authorize`} />
            <span className="text-sm font-medium">Autorizo</span>
          </label>
          <label
            htmlFor={`term-${term.id}-decline`}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
              response === false ? "border-primary bg-primary/5" : "border-border/60",
            )}
          >
            <RadioGroupItem value="decline" id={`term-${term.id}-decline`} />
            <span className="text-sm font-medium">Não autorizo</span>
          </label>
        </RadioGroup>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3 cursor-pointer">
      <Checkbox
        checked={response === true}
        onCheckedChange={(checked) => onResponseChange(term.id, checked === true)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium">
          {term.title}
          {term.isRequired ? " *" : ""}
        </p>
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{term.content}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </label>
  );
};

export const setTermResponse = (
  responses: AcceptanceTermResponses,
  termId: string,
  accepted: boolean,
): AcceptanceTermResponses => ({
  ...responses,
  [termId]: accepted,
});
