import { SuporteRequestWorkspace } from "@/components/suporte/SuporteRequestWorkspace";

const SuporteNovo = () => (
  <SuporteRequestWorkspace
    backHref="/suporte"
    backLabel="Voltar"
    descriptionPlaceholder="Explique o que você precisa, com o máximo de contexto possível."
    formCardDescription="Informe um título e os detalhes da sua solicitação."
    heading="Solicitar atendimento"
    intro="Abra um novo chamado ou acompanhe solicitações em aberto e finalizadas. Você não poderá editar depois — apenas excluir pedidos ainda não em implementação."
    titlePlaceholder="Resumo curto do pedido"
  />
);

export default SuporteNovo;
