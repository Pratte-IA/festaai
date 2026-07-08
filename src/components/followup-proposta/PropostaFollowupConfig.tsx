import { ChevronDown, Clock, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END,
  PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START,
  PROPOSTA_FOLLOWUP_0_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL,
  PROPOSTA_FOLLOWUP_1_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_2_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE,
  PROPOSTA_FOLLOWUP_3_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA,
  PROPOSTA_FOLLOWUP_4_DELAY_HOURS,
  PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
  PROPOSTA_FOLLOWUP_LOSS_MOTIVO,
  PROPOSTA_FOLLOWUP_TEMPLATE_KEY,
} from "@/features/eventos/proposta-followup";
import {
  buildPropostaFollowup0PreviewMessage,
  buildPropostaFollowup1PreviewMessage,
  buildPropostaFollowup2PreviewMessage,
  buildPropostaFollowup3PreviewMessage,
  buildPropostaFollowup4PreviewMessage,
  PROPOSTA_FOLLOWUP_PREVIEW,
} from "@/features/eventos/build-proposta-followup-preview";
import {
  useSaveTenantMessageTemplate,
  useTenantMessageTemplates,
  type MessageTemplate,
} from "@/features/configuracoes";
import { useTenantCompanyProfile } from "@/features/guided-setup";
import { useCurrentTenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";
import { formatCompanyDisplayName } from "@/lib/company-display-name";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";
import { cn } from "@/lib/utils";

interface PropostaFollowupConfigProps {
  showSettingsHeader?: boolean;
}

const TEMPLATE_VARIABLES = [
  "{{primeiro_nome}}",
  "{{nome_aniversariante}}",
  "{{data_festa}}",
  "{{nome_empresa}}",
];

const FU0_TEMPLATE_VARIABLES = ["{{primeiro_nome}}", "{{nome_empresa}}"];

const FollowupTemplateEditor = ({
  description,
  isSaving,
  onChange,
  onSave,
  previewMessage,
  template,
  title,
  variables = TEMPLATE_VARIABLES,
}: {
  description: string;
  isSaving: boolean;
  onChange: (body: string) => void;
  onSave: () => void;
  previewMessage: string;
  template: MessageTemplate;
  title: string;
  variables?: string[];
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
  <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>

    <div className="space-y-2">
      <Label htmlFor={`template-${template.key}`}>Mensagem padrão</Label>
      <Textarea
        id={`template-${template.key}`}
        value={template.body}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
        className="font-mono text-sm leading-relaxed"
      />
      <p className="text-xs text-muted-foreground">
        Variáveis: {variables.join(" · ")}
      </p>
    </div>

    <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
      <CollapsibleTrigger asChild>
        <Button
          className="h-auto w-full justify-between gap-2 px-3 py-2.5 text-left font-normal"
          type="button"
          variant="outline"
        >
          <span className="text-sm text-foreground">Prévia com dados de exemplo</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              previewOpen && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="rounded-xl border border-border/60 bg-background/80 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{previewMessage}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>

    <Button disabled={isSaving} onClick={onSave} size="sm" type="button">
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar mensagem"
      )}
    </Button>
  </div>
  );
};

export const PropostaFollowupConfig = ({ showSettingsHeader }: PropostaFollowupConfigProps) => {
  const { currentTenant } = useCurrentTenant();
  const { data: companyProfile } = useTenantCompanyProfile();
  const { data: templates = [], isLoading } = useTenantMessageTemplates();
  const saveTemplate = useSaveTenantMessageTemplate();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const companyLegalName =
    companyProfile?.companyName?.trim() || currentTenant?.name?.trim() || "Sua Casa de Festas";

  const templateByKey = useMemo(() => new Map(templates.map((t) => [t.key, t])), [templates]);

  const getTemplate = (key: string, fallbackTitle: string): MessageTemplate => {
    const stored = templateByKey.get(key);
    return {
      body: drafts[key] ?? stored?.body ?? "",
      id: stored?.id,
      key,
      title: stored?.title ?? fallbackTitle,
    };
  };

  const fu0Template = getTemplate(
    PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL,
    "Follow-up 0 — retomada de contato inicial",
  );
  const dataLivreTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE,
    "Follow-up 1 — data livre",
  );
  const dataIndisponivelTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL,
    "Follow-up 1 — data indisponível",
  );
  const fu2DataLivreTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE,
    "Follow-up 2 — data livre",
  );
  const fu2DataIndisponivelTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL,
    "Follow-up 2 — data indisponível",
  );
  const fu3VisitaTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA,
    "Follow-up 3 — convite de visita",
  );
  const fu4EncerramentoTemplate = getTemplate(
    PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
    "Follow-up 4 — encerramento",
  );

  const previewFu0 = useMemo(
    () =>
      buildPropostaFollowup0PreviewMessage({
        clienteNome: PROPOSTA_FOLLOWUP_PREVIEW.clienteNome,
        companyLegalName,
        templateBody: fu0Template.body,
      }),
    [companyLegalName, fu0Template.body],
  );

  const previewDataLivre = useMemo(
    () =>
      buildPropostaFollowup1PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: dataLivreTemplate.body,
        variante: "data_livre",
      }),
    [companyLegalName, dataLivreTemplate.body],
  );

  const previewDataIndisponivel = useMemo(
    () =>
      buildPropostaFollowup1PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: dataIndisponivelTemplate.body,
        variante: "data_indisponivel",
      }),
    [companyLegalName, dataIndisponivelTemplate.body],
  );

  const previewFu2DataLivre = useMemo(
    () =>
      buildPropostaFollowup2PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu2DataLivreTemplate.body,
        variante: "data_livre",
      }),
    [companyLegalName, fu2DataLivreTemplate.body],
  );

  const previewFu2DataIndisponivel = useMemo(
    () =>
      buildPropostaFollowup2PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu2DataIndisponivelTemplate.body,
        variante: "data_indisponivel",
      }),
    [companyLegalName, fu2DataIndisponivelTemplate.body],
  );

  const previewFu3Visita = useMemo(
    () =>
      buildPropostaFollowup3PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu3VisitaTemplate.body,
      }),
    [companyLegalName, fu3VisitaTemplate.body],
  );

  const previewFu4Encerramento = useMemo(
    () =>
      buildPropostaFollowup4PreviewMessage({
        ...PROPOSTA_FOLLOWUP_PREVIEW,
        companyLegalName,
        templateBody: fu4EncerramentoTemplate.body,
      }),
    [companyLegalName, fu4EncerramentoTemplate.body],
  );

  const handleSave = async (template: MessageTemplate) => {
    setSavingKey(template.key);
    try {
      await saveTemplate.mutateAsync(template);
      setDrafts((current) => {
        const next = { ...current };
        delete next[template.key];
        return next;
      });
      toast({ title: "Mensagem salva" });
    } catch {
      toast({
        title: "Não foi possível salvar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando follow-ups...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showSettingsHeader ? (
        <SettingsPageHeader
          title={SETTINGS_PAGE_META["followup-proposta"].title}
          description={SETTINGS_PAGE_META["followup-proposta"].description}
          stats={
            <>
              <SettingsStatChip>FU0 + Sequência FU1–FU4 ativa</SettingsStatChip>
              <SettingsStatChip>
                FU0 {PROPOSTA_FOLLOWUP_0_DELAY_HOURS}h · FU1 {PROPOSTA_FOLLOWUP_1_DELAY_HOURS}h ·
                FU2/FU3 {PROPOSTA_FOLLOWUP_2_DELAY_HOURS}h · FU4 {PROPOSTA_FOLLOWUP_4_DELAY_HOURS}h
              </SettingsStatChip>
            </>
          }
        />
      ) : null}

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
        <p className="text-foreground font-medium">O que são os follow-ups de proposta?</p>
        <p>
          São mensagens automáticas no WhatsApp para leads que receberam proposta e ainda não
          responderam. O objetivo é retomar o contato com carinho, tirar dúvidas e ajudar a família
          a decidir — sem depender de lembrete manual da equipe.
        </p>
        <p>
          Cada mensagem enviada fica registrada na memória do agente de atendimento, para que, quando
          o cliente responder, a IA saiba exatamente o que já foi dito.
        </p>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Regra de disparo — Follow-up 0 (contato inicial)</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_0_DELAY_HOURS} horas</span>{" "}
                após a <strong>nossa última mensagem</strong> ao lead em Contato Inicial
              </li>
              <li>
                Enviado apenas dentro do horário comercial (
                <span className="text-foreground">
                  {PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START}h às{" "}
                  {PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END}h
                </span>
                , fuso de Brasília)
              </li>
              <li>Lead ainda em Contato Inicial e sem retorno após a nossa mensagem</li>
              <li>Se o cliente responder, o timer é zerado automaticamente e o FU0 não é enviado</li>
              <li>É uma mensagem única — não substitui a sequência FU1–FU4 da proposta</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Regra de disparo — Follow-up 1</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
                <li>
                  <span className="text-foreground">{PROPOSTA_FOLLOWUP_1_DELAY_HOURS} horas</span>{" "}
                  após o lead entrar em <strong>Proposta Enviada</strong>
                </li>
                <li>Lead ainda na etapa Proposta Enviada, sem retorno no WhatsApp</li>
                <li>Data da festa cadastrada (obrigatória para enviar proposta)</li>
                <li>Antes do envio, o sistema verifica se a data ainda está livre na agenda</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Validação da data</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
                <li>
                  <strong>Data livre</strong> → mensagem informando que a data ainda está disponível
                </li>
                <li>
                  <strong>Data ocupada</strong> → mensagem informando que outra família reservou e
                  oferecendo ajuda com novas datas
                </li>
                <li>Se o cliente responder, a sequência pausa automaticamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Regra de disparo — Follow-up 2</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_2_DELAY_HOURS} horas</span>{" "}
                após o envio do Follow-up 1
              </li>
              <li>Lead ainda em Proposta Enviada, sem retorno no WhatsApp após o FU1</li>
              <li>Mesma validação de data livre/ocupada antes do envio</li>
              <li>Qualquer resposta do cliente (texto ou áudio) pausa a sequência</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Regra de disparo — Follow-up 3</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_3_DELAY_HOURS} horas</span>{" "}
                após o envio do Follow-up 2
              </li>
              <li>Convite para visita presencial — sem validação de data na agenda</li>
              <li>Lead ainda em Proposta Enviada, sem retorno no WhatsApp após o FU2</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Regra de disparo — Follow-up 4</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
              <li>
                <span className="text-foreground">{PROPOSTA_FOLLOWUP_4_DELAY_HOURS} horas</span>{" "}
                após o envio do Follow-up 3
              </li>
              <li>Mensagem de encerramento amigável, sem pressão</li>
              <li>
                Após o envio, o lead é movido automaticamente para{" "}
                <strong>Perdido</strong> ({PROPOSTA_FOLLOWUP_LOSS_MOTIVO.toLowerCase()})
              </li>
              <li>A sequência de follow-up é marcada como concluída</li>
              <li>
                Se o cliente retomar depois com mensagem relevante, o lead volta para{" "}
                <strong>Negociação</strong>. Respostas curtas (ok, obrigada, figurinha, reação)
                permanecem em Perdido
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            O disparo usa o número vinculado em{" "}
            <span className="font-medium text-foreground">Automações → Follow-up de Proposta</span>.
            No envio real, substituímos os nomes e a data pelos dados de cada evento e usamos o nome
            comercial{" "}
            <span className="font-medium text-foreground">
              {formatCompanyDisplayName(companyLegalName)}
            </span>
            .
          </p>
        </div>
      </div>

      <FollowupTemplateEditor
        description="Enviada 12h após a nossa última mensagem a um lead em Contato Inicial que não retornou, dentro do horário comercial. Retomada leve do atendimento."
        isSaving={savingKey === PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL}
        onChange={(body) =>
          setDrafts((current) => ({
            ...current,
            [PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL]: body,
          }))
        }
        onSave={() => void handleSave(fu0Template)}
        previewMessage={previewFu0}
        template={fu0Template}
        title="Follow-up 0 — retomada de contato inicial"
        variables={FU0_TEMPLATE_VARIABLES}
      />

      <FollowupTemplateEditor
        description="Enviada quando a data da festa ainda está livre na agenda (sem festa confirmada nem bloqueio manual)."
        isSaving={savingKey === PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE}
        onChange={(body) =>
          setDrafts((current) => ({ ...current, [PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE]: body }))
        }
        onSave={() => void handleSave(dataLivreTemplate)}
        previewMessage={previewDataLivre}
        template={dataLivreTemplate}
        title="Follow-up 1 — data livre"
      />

      <FollowupTemplateEditor
        description="Enviada quando a data já foi reservada por outra família ou está bloqueada na agenda."
        isSaving={savingKey === PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL}
        onChange={(body) =>
          setDrafts((current) => ({
            ...current,
            [PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL]: body,
          }))
        }
        onSave={() => void handleSave(dataIndisponivelTemplate)}
        previewMessage={previewDataIndisponivel}
        template={dataIndisponivelTemplate}
        title="Follow-up 1 — data indisponível"
      />

      <FollowupTemplateEditor
        description="Enviada 72h após o FU1, quando a data da festa ainda está livre na agenda."
        isSaving={savingKey === PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE}
        onChange={(body) =>
          setDrafts((current) => ({ ...current, [PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE]: body }))
        }
        onSave={() => void handleSave(fu2DataLivreTemplate)}
        previewMessage={previewFu2DataLivre}
        template={fu2DataLivreTemplate}
        title="Follow-up 2 — data livre"
      />

      <FollowupTemplateEditor
        description="Enviada 72h após o FU1, quando a data já foi reservada ou está bloqueada."
        isSaving={savingKey === PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL}
        onChange={(body) =>
          setDrafts((current) => ({
            ...current,
            [PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL]: body,
          }))
        }
        onSave={() => void handleSave(fu2DataIndisponivelTemplate)}
        previewMessage={previewFu2DataIndisponivel}
        template={fu2DataIndisponivelTemplate}
        title="Follow-up 2 — data indisponível"
      />

      <FollowupTemplateEditor
        description="Enviada 72h após o FU2 — convite para conhecer o espaço pessoalmente e agendar uma visita."
        isSaving={savingKey === PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA}
        onChange={(body) =>
          setDrafts((current) => ({ ...current, [PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA]: body }))
        }
        onSave={() => void handleSave(fu3VisitaTemplate)}
        previewMessage={previewFu3Visita}
        template={fu3VisitaTemplate}
        title="Follow-up 3 — convite de visita"
      />

      <FollowupTemplateEditor
        description="Enviada 48h após o FU3 — encerramento da sequência. O lead vai para Perdido após o envio."
        isSaving={savingKey === PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO}
        onChange={(body) =>
          setDrafts((current) => ({
            ...current,
            [PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO]: body,
          }))
        }
        onSave={() => void handleSave(fu4EncerramentoTemplate)}
        previewMessage={previewFu4Encerramento}
        template={fu4EncerramentoTemplate}
        title="Follow-up 4 — encerramento"
      />

      <p className="text-xs text-muted-foreground">
        Chave técnica da automação: <code className="font-mono">{PROPOSTA_FOLLOWUP_TEMPLATE_KEY}</code>
      </p>
    </div>
  );
};

export default PropostaFollowupConfig;
