export const PROPOSTA_FOLLOWUP_TEMPLATE_KEY = "follow-up-proposta";

export const PROPOSTA_FOLLOWUP_0_DELAY_HOURS = 12;

// Horas sem retorno do cliente (após a nossa última mensagem) para o Kanban
// começar a sinalizar "Aguard. FU0" — antecipa o disparo automático em 12h.
export const PROPOSTA_FOLLOWUP_0_AGUARDANDO_BADGE_HOURS = 2;

export const PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_START = 8;

export const PROPOSTA_FOLLOWUP_0_BUSINESS_HOUR_END = 18;

export const PROPOSTA_FOLLOWUP_0_TEMPLATE_CONTATO_INICIAL = "follow-up-proposta-0-contato-inicial";

export const PROPOSTA_FOLLOWUP_0B_DELAY_HOURS = 6;

export const PROPOSTA_FOLLOWUP_0B_TEMPLATE_ENCERRAMENTO =
  "follow-up-proposta-0b-encerramento";

export const PROPOSTA_FOLLOWUP_0B_LOSS_MOTIVO =
  "Sem retorno após follow-ups de contato inicial";

export const PROPOSTA_FOLLOWUP_1_DELAY_HOURS = 48;

export const PROPOSTA_FOLLOWUP_2_DELAY_HOURS = 72;

export const PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE = "follow-up-proposta-1-data-livre";

export const PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-proposta-1-data-indisponivel";

export const PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE = "follow-up-proposta-2-data-livre";

export const PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-proposta-2-data-indisponivel";

export const PROPOSTA_FOLLOWUP_3_DELAY_HOURS = 72;

export const PROPOSTA_FOLLOWUP_3_TEMPLATE_VISITA = "follow-up-proposta-3-visita";

export const PROPOSTA_FOLLOWUP_3_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-proposta-3-data-indisponivel";

export const PROPOSTA_FOLLOWUP_4_DELAY_HOURS = 48;

export const PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO = "follow-up-proposta-4-encerramento";

export const PROPOSTA_FOLLOWUP_4_TEMPLATE_DATA_INDISPONIVEL =
  "follow-up-proposta-4-data-indisponivel";

export const PROPOSTA_FOLLOWUP_LOSS_MOTIVO =
  "Sem retorno após sequência de follow-ups de proposta";

export type PropostaFollowupDateVariante = "data_livre" | "data_indisponivel";

export type PropostaFollowupStatus =
  | "ativo"
  | "pausado_resposta"
  | "concluido_perdido"
  | "cancelado";

export type PropostaFollowup1Variante = PropostaFollowupDateVariante;

export type PropostaFollowup2Variante = PropostaFollowupDateVariante;

export type PropostaFollowup3Variante = PropostaFollowupDateVariante;

export type PropostaFollowup4Variante = PropostaFollowupDateVariante;

export const propostaFollowupStatusLabels: Record<PropostaFollowupStatus, string> = {
  ativo: "Follow-up ativo",
  cancelado: "Follow-up cancelado",
  concluido_perdido: "Follow-up encerrado",
  pausado_resposta: "Cliente respondeu",
};

export const DEFAULT_PROPOSTA_FOLLOWUP_0_CONTATO_INICIAL = `Oiii, {{primeiro_nome}}! Tudo bem? 😊

Passando aqui para saber se ficou alguma dúvida — a gente adoraria te ajudar com tudo o que você precisar para planejar essa festa especial. 🎉

Ficamos no aguardo do seu retorno para darmos sequência no atendimento e cuidar de cada detalhe com muito carinho. 💛✨`;

export const DEFAULT_PROPOSTA_FOLLOWUP_0B_ENCERRAMENTO = `Oiii, {{primeiro_nome}}! 😊

Você ainda mantém interesse em fazer uma festa na {{nome_empresa}}? 🎉

Ficamos no aguardo do seu retorno por aqui — será um prazer te ajudar a planejar esse dia especial. 💛✨`;

export const DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui para ver se ficou alguma dúvida sobre a proposta da festa de {{nome_aniversariante}}.

Sei que escolher o lugar da festa envolve carinho, organização e também segurança de que tudo vai dar certo no dia. Por isso, quero te ajudar a deixar essa decisão mais fácil. ✨

A data {{data_festa}} ainda está livre por enquanto.

Quer que eu te explique como funciona para garantir essa data ou prefere que eu ajuste algum ponto da proposta?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui para te atualizar sobre a festa de {{nome_aniversariante}}.

A data {{data_festa}} acabou sendo reservada por outra família, mas a gente continua com muito carinho e interesse em receber vocês na {{nome_empresa}} para viver esse dia especial. ✨

Às vezes uma nova data também pode funcionar muito bem para a família, e eu posso te ajudar a encontrar a melhor opção disponível na nossa agenda.

Quer que eu veja quais datas ainda temos livres para a festa de {{nome_aniversariante}}?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui porque a data {{data_festa}} para a festa de {{nome_aniversariante}} ainda está disponível, mas eu não queria deixar passar muito tempo sem te avisar.

A gente adoraria receber vocês aqui na {{nome_empresa}} e preparar uma festa linda, leve e especial para {{nome_aniversariante}}. Tenho certeza de que seria um dia muito gostoso para a família aproveitar de verdade. ✨

Como nossa agenda vai sendo preenchida conforme as reservas são confirmadas, queria entender com você:

O que falta para conseguirmos seguir com a reserva dessa data?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui para retomar o contato sobre a festa de {{nome_aniversariante}}.

A data {{data_festa}} acabou sendo reservada por outra família, mas a gente adoraria receber vocês na {{nome_empresa}} e preparar uma festa linda, leve e especial — mesmo que seja em outra data. ✨

Como nossa agenda vai sendo preenchida conforme as reservas são confirmadas, queria entender com você:

O que falta para conseguirmos seguir com a festa de {{nome_aniversariante}}?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui de novo sobre a festa de {{nome_aniversariante}} na data {{data_festa}}.

Às vezes, só pela proposta, não dá para sentir tudo que a {{nome_empresa}} oferece: o espaço, os brinquedos, a estrutura, o carinho nos detalhes e como a festa pode ficar linda para a família aproveitar de verdade. ✨

Por isso, queria te fazer um convite: que tal vir na {{nome_empresa}} pessoalmente?

Assim você vê o espaço com calma, tira suas dúvidas e consegue sentir se faz sentido para esse dia especial.

Vamos agendar um horário para uma visita?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_3_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui de novo sobre a festa de {{nome_aniversariante}}.

A data {{data_festa}} acabou sendo reservada por outra família, mas a gente continua com muito carinho e interesse em receber vocês na {{nome_empresa}}. ✨

Que tal vir conhecer o espaço pessoalmente? Assim você vê tudo com calma, tira suas dúvidas e a gente já aproveita para olhar juntas outras datas disponíveis.

Vamos agendar um horário para uma visita?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Como não tivemos seu retorno, vou pausar por aqui — e se fizer sentido no futuro, a gente retoma com carinho.

A gente segue com muito carinho e interesse em receber vocês na {{nome_empresa}} para celebrar a festa de {{nome_aniversariante}}, mas também entendemos que cada família tem seu tempo para decidir. ✨

Por enquanto, a data {{data_festa}} continuará disponível para novas reservas.

Se em algum momento você quiser retomar a proposta, ajustar algum detalhe ou agendar uma visita, é só me chamar por aqui. Vai ser uma alegria te ajudar.`;

export const DEFAULT_PROPOSTA_FOLLOWUP_4_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Como não tivemos seu retorno, vou pausar por aqui — e se fizer sentido no futuro, a gente retoma com carinho.

A gente segue com muito carinho e interesse em receber vocês na {{nome_empresa}} para celebrar a festa de {{nome_aniversariante}}, mas também entendemos que cada família tem seu tempo para decidir. ✨

A data {{data_festa}} já não está mais disponível, mas se em algum momento você quiser retomar a proposta, escolher outra data ou agendar uma visita, é só me chamar por aqui. Vai ser uma alegria te ajudar.`;

export const getPropostaFollowupKanbanBadge = (evento: {
  contato_inicial_ultima_mensagem_em?: string | null;
  created_at?: string | null;
  etapa: string;
  followup_0_enviado_em?: string | null;
  followup_0b_enviado_em?: string | null;
  followup_1_enviado_em?: string | null;
  followup_2_enviado_em?: string | null;
  followup_3_enviado_em?: string | null;
  followup_4_enviado_em?: string | null;
  followup_status?: string | null;
  proposta_enviada_em?: string | null;
  updated_at?: string | null;
}): { className: string; label: string } | null => {
  if (evento.etapa === "contato_inicial") {
    if (evento.followup_0_enviado_em) {
      // Se o cliente já respondeu após o FU0, o marco é zerado — mostra FU0 ✓.
      if (!evento.contato_inicial_ultima_mensagem_em) {
        return { className: "bg-success/15 text-success", label: "FU0 ✓" };
      }
      return { className: "bg-muted text-muted-foreground", label: "Aguard. FU0b" };
    }

    // Só sinaliza com o marco real da nossa última mensagem aguardando
    // retorno. Sem ele (backlog anterior à ativação / sem rastreio), não
    // mostra badge — updated_at/created_at geravam falso "Aguard. FU0".
    const referencia = evento.contato_inicial_ultima_mensagem_em;
    if (!referencia) return null;

    const horasSemRetorno = (Date.now() - new Date(referencia).getTime()) / (1000 * 60 * 60);
    if (horasSemRetorno >= PROPOSTA_FOLLOWUP_0_AGUARDANDO_BADGE_HOURS) {
      return { className: "bg-muted text-muted-foreground", label: "Aguard. FU0" };
    }

    return null;
  }

  // Em Perdido, o Kanban mostra só badges da sequência da etapa (FUP/FOP).
  // O histórico FU0/FU0b/FU1–FU4 fica no timeline do evento.
  if (evento.etapa !== "proposta_enviada") return null;

  if (evento.followup_3_enviado_em) {
    return { className: "bg-muted text-muted-foreground", label: "Aguard. FU4" };
  }

  if (evento.followup_2_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FU2 ✓" };
  }

  if (evento.followup_1_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FU1 ✓" };
  }

  const aguardandoFu1 =
    evento.proposta_enviada_em &&
    (evento.followup_status === "ativo" || evento.followup_status === "pausado_resposta");

  if (aguardandoFu1) {
    return { className: "bg-muted text-muted-foreground", label: "Aguard. FU1" };
  }

  if (evento.followup_status === "pausado_resposta") {
    return { className: "bg-primary/15 text-primary", label: "Respondeu" };
  }

  return null;
};

// Badge secundário exibido logo abaixo do badge de follow-up (ex.: "FU1 ✓")
// quando o cliente responde DEPOIS de já termos enviado algum follow-up de
// proposta — ou seja, respondeu AO follow-up. Clientes que responderam antes do
// primeiro follow-up (resposta à própria proposta) não recebem este selo, pois
// o FU1 é sempre enviado a todos e não representaria uma resposta ao follow-up.
export const getPropostaFollowupRespondedKanbanBadge = (evento: {
  etapa: string;
  followup_1_enviado_em?: string | null;
  followup_2_enviado_em?: string | null;
  followup_3_enviado_em?: string | null;
  followup_4_enviado_em?: string | null;
  followup_resposta_cliente_em?: string | null;
  followup_status?: string | null;
}): { className: string; label: string } | null => {
  if (evento.etapa !== "proposta_enviada") return null;
  if (evento.followup_status !== "pausado_resposta") return null;
  if (!evento.followup_resposta_cliente_em) return null;

  // Data (epoch ms) do primeiro follow-up efetivamente enviado.
  const primeiroFollowupEnviadoEm = [
    evento.followup_1_enviado_em,
    evento.followup_2_enviado_em,
    evento.followup_3_enviado_em,
    evento.followup_4_enviado_em,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time))
    .reduce<number | null>((menor, atual) => (menor === null || atual < menor ? atual : menor), null);

  if (primeiroFollowupEnviadoEm === null) return null;

  const respostaEm = new Date(evento.followup_resposta_cliente_em).getTime();

  // Só sinaliza "Respondeu" quando a resposta do cliente veio APÓS o primeiro
  // follow-up. Resposta anterior ao follow-up é resposta à proposta, não a ele.
  if (!Number.isFinite(respostaEm) || respostaEm <= primeiroFollowupEnviadoEm) {
    return null;
  }

  return { className: "bg-primary/15 text-primary", label: "Respondeu" };
};
