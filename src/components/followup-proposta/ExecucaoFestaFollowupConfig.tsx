import { ArrowLeft, CalendarDays, MessageCircle, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";

import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { FollowupCollapsiblePanel } from "@/components/followup-proposta/FollowupCollapsiblePanel";
import {
  FollowupRuleCard,
  FollowupRuleList,
  FollowupSection,
} from "@/components/followup-proposta/FollowupRuleCard";
import { SETE_DIAS_AUTOMATION_EFFECTIVE_DATE } from "@/features/automations/sete-dias-antes";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

interface ExecucaoFestaFollowupConfigProps {
  showSettingsHeader?: boolean;
}

export const ExecucaoFestaFollowupConfig = ({ showSettingsHeader }: ExecucaoFestaFollowupConfigProps) => {
  const meta = SETTINGS_PAGE_META["followups/execucao"];

  return (
    <div className="space-y-6">
      {showSettingsHeader ? (
        <>
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            to="/configuracoes/followups"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar para Follow-ups
          </Link>
          <SettingsPageHeader
            title={meta.title}
            description={meta.description}
            stats={
              <>
                <SettingsStatChip>Boas Vindas: após assinatura</SettingsStatChip>
                <SettingsStatChip>7 dias antes: cron diário</SettingsStatChip>
              </>
            }
          />
        </>
      ) : null}

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
        <p className="text-foreground font-medium">Execução de festa</p>
        <p>
          Mensagens automáticas enviadas após o fechamento da festa e na semana que antecede o evento.
          O conteúdo é montado no fluxo de automação (n8n) da sua casa.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Boas Vindas</h2>
        </div>
      </div>

      <FollowupSection>
        <FollowupRuleCard title="Regras de disparo — Boas Vindas">
          <FollowupRuleList>
            <li>
              Disparo <span className="text-foreground">imediato</span> após a assinatura do contrato
              eletrônico
            </li>
            <li>O evento é movido para a etapa <strong>Boas Vindas</strong> no funil Festa</li>
            <li>Envio único por evento — não repete</li>
            <li>O fluxo recebe dados completos do evento, pacote e formulário de contratação</li>
          </FollowupRuleList>
        </FollowupRuleCard>

        <FollowupCollapsiblePanel
          description="Texto configurado no fluxo de automação (n8n) da sua casa."
          expandLabel="Ver detalhes da mensagem"
          title="Mensagem de Boas Vindas"
        >
          <p className="text-sm text-muted-foreground">
            O disparo usa o número vinculado em{" "}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              to="/configuracoes/automacoes"
            >
              Automações → Boas Vindas
            </Link>
            . O texto e a formatação da mensagem são definidos no workflow n8n vinculado a este tenant.
          </p>
        </FollowupCollapsiblePanel>
      </FollowupSection>

      <div className="border-t border-border/60 pt-8 space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">7 dias antes da festa</h2>
        </div>
      </div>

      <FollowupSection>
        <FollowupRuleCard title="Regras de disparo — 7 dias antes">
          <FollowupRuleList>
            <li>
              Verificação <span className="text-foreground">diária</span> via cron — festas cuja data cai
              exatamente daqui a 7 dias
            </li>
            <li>Evento no funil <strong>Festa</strong>, status interno ativo</li>
            <li>Envio único por evento — não repete após o primeiro disparo</li>
            <li>
              Automação ativa a partir de{" "}
              <span className="text-foreground">{SETE_DIAS_AUTOMATION_EFFECTIVE_DATE}</span>
            </li>
          </FollowupRuleList>
        </FollowupRuleCard>

        <FollowupCollapsiblePanel
          description="Texto configurado no fluxo de automação (n8n) da sua casa."
          expandLabel="Ver detalhes da mensagem"
          title="Mensagem de 7 dias antes"
        >
          <p className="text-sm text-muted-foreground">
            O disparo usa o número vinculado em{" "}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              to="/configuracoes/automacoes"
            >
              Automações → 7 dias Antes da Festa
            </Link>
            . O texto e as orientações enviadas são definidos no workflow n8n vinculado a este tenant.
          </p>
        </FollowupCollapsiblePanel>
      </FollowupSection>

      <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Para alterar o conteúdo dessas mensagens, edite o fluxo n8n da sua casa ou fale com o suporte
            FestaAI.
          </p>
        </div>
      </div>
    </div>
  );
};
