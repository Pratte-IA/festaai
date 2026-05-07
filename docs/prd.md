Crie um sistema SaaS chamado FestaAI, focado em casas de festas infantis.
O sistema deve ser simples, visual, moderno e orientado a ação, ajudando empresas a vender mais festas e organizar toda a operação sem caos.
A interface deve ser pensada para usuários não técnicos, com foco em clareza, rapidez e facilidade de uso.
---
IDENTIDADE VISUAL
Utilizar a identidade visual da marca FestaAI conforme os seguintes padrões:
Cores principais:
- #000000 (preto)
- #ececec (cinza claro)
Cores de apoio:
- #5158e7 (azul)
- #e57369 (coral)
- #d95693 (rosa)
- #e6bce9 (lilás)
Gradiente principal:
- Mistura suave entre azul, rosa, roxo e preto (usar como fundo, destaques e elementos de branding)
Estilo:
- moderno
- tecnológico
- limpo
- elegante
Aplicação:
- fundo com gradiente suave
- cards claros (#ececec) sobre fundo escuro ou gradiente
- botões com destaque nas cores principais
- evitar poluição visual
Tipografia:
- sans-serif moderna
- boa legibilidade
- hierarquia clara
---
1. DASHBOARD
Criar um dashboard principal com visão clara e acionável.
Dividir em blocos:
Vendas:
- Leads no período
- Festas fechadas
- Taxa de conversão
- Valor vendido
Operação:
- Festas a executar (lista)
- Próximas festas
- Festas com pendências
- Planejamentos não respondidos
- Contratos pendentes
Financeiro:
- Faturamento do mês
- Valor a receber
- Eventos com saldo pendente
Pós-venda:
- Feedback pendente
- Clientes em redes sociais
- Oportunidades futuras
Extras obrigatórios:
- Calendário de festas (visual mensal)
- Lista de festas do mês
- Comparativo com mês anterior (crescimento ou queda)
O dashboard deve destacar automaticamente itens que precisam de atenção.
---
2. CRM (BASE DO SISTEMA)
O sistema deve ser baseado em uma única entidade chamada "eventos".
Cada evento representa toda a jornada:
do primeiro contato até o pós-venda.
Campos principais:
- nome do cliente
- telefone
- data da festa
- valor total
- funil atual (vendas, festa, executadas)
- etapa atual
- status interno (para controle de processo)
- datas importantes (criação, atualização)
---
3. FUNIS (KANBAN)
Criar visual estilo kanban com drag and drop.
Funil de Vendas:
- Contato Inicial
- Proposta Enviada
- Negociação
- Visita Agendada
- Fechado
- Perdido
Funil de Festa:
- Boas Vindas
- Planejamento
- Contrato
- Organização
- Festa Pronta
Funil de Executadas:
- Aguardando Feedback
- Redes Sociais
- Oportunidade Futura
Cada card deve exibir:
- nome do cliente
- data da festa
- valor
- etapa atual
---
4. RELATÓRIOS
Criar módulo de relatórios com:
Vendas:
- quantidade de leads
- taxa de conversão
- tempo médio de fechamento
Financeiro:
- faturamento
- ticket médio
- valores em aberto
Eventos:
- quantidade de festas por período
- ocupação por data
Pós-venda:
- quantidade de feedbacks recebidos
- clientes em redes sociais
- oportunidades futuras
---
5. CENTRAL DE CONTROLE (CONFIGURAÇÃO POR CLIENTE)
Criar uma área onde cada empresa pode configurar seu sistema:
Pacotes:
- nome
- valor
- itens inclusos
- adicionais
Mensagens:
- mensagens padrão utilizadas no processo (sem automação interna)
Financeiro:
- regras de pagamento
- valor de entrada padrão
Processo:
- ativar ou desativar etapas
---
6. EXPERIÊNCIA DO USUÁRIO
O sistema deve ser:
- extremamente simples
- intuitivo
- rápido
- visualmente limpo
Priorizar:
- clareza
- ações pendentes
- organização do fluxo de trabalho
---
7. PRINCÍPIOS DO PRODUTO
- O sistema deve mostrar o que precisa de ação
- Não deve ter complexidade desnecessária
- Não deve conter automação interna de follow-up
- Deve funcionar como centro de controle da empresa
- Deve ser escalável para múltiplos clientes (multi-tenant)

