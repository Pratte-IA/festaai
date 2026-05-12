import { SuporteRequestWorkspace } from "@/components/suporte/SuporteRequestWorkspace";

const SuporteAgente = () => (
  <SuporteRequestWorkspace
    backHref="/suporte"
    backLabel="Voltar ao suporte"
    descriptionPlaceholder="Contexto, exemplo de mensagem atual e como você quer que o agente responda no WhatsApp."
    formCardDescription="Todos os campos com * são obrigatórios, exceto área impactada e exemplo desejado."
    heading="Suporte — Agente FestaAI"
    intro="Solicite melhorias no agente FestaAI do seu WhatsApp (tom de voz, respostas e fluxos). Use a aba Nova solicitação para abrir um pedido ou Histórico para acompanhar status e cobrança quando aplicável. Apenas administradores da empresa podem enviar novos pedidos. Você não poderá editar depois — apenas excluir pedidos ainda não em implementação."
    novaSolicitacaoForm="detailed"
    titlePlaceholder="Ex.: ajustar tom de saudação no orçamento"
  />
);

export default SuporteAgente;
