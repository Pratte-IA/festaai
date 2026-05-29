export const DEFAULT_CONTRACT_TEMPLATE_HTML = `<article class="contract-document">
<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS PARA FESTA INFANTIL</h1>
<p><strong>Nº:</strong> {{contract_number}}</p>

<h2>1. Partes</h2>
<p><strong>CONTRATADA:</strong> Espaço de festas (conforme cadastro do estabelecimento).</p>
<p><strong>CONTRATANTE:</strong> {{cliente_nome}}, CPF {{cliente_cpf}}, RG {{cliente_rg}}, residente em {{cliente_endereco}}.</p>
<p><strong>Contato:</strong> {{cliente_telefone}} · {{cliente_email}}</p>

<h2>2. Dados da festa</h2>
<ul>
  <li><strong>Aniversariante:</strong> {{aniversariante_nome}}</li>
  <li><strong>Data de nascimento:</strong> {{aniversariante_data_nascimento}}</li>
  <li><strong>Data da festa:</strong> {{data_evento}}</li>
  <li><strong>Horário:</strong> {{hora_evento}} às {{hora_termino}}</li>
  <li><strong>Convidados:</strong> {{quantidade_convidados}} (adultos: {{quantidade_adultos}}, crianças: {{quantidade_crianas}})</li>
  <li><strong>Tema:</strong> {{aniversariante_tema}}</li>
</ul>

<h2>3. Pacote contratado</h2>
<p><strong>Pacote:</strong> {{pacote_nome}}</p>
<p><strong>Convidados inclusos no pacote:</strong> {{pacote_convidados_inclusos}}</p>
<p><strong>Itens inclusos:</strong></p>
<pre>{{itens_inclusos}}</pre>
<p><strong>Itens não inclusos:</strong></p>
<pre>{{itens_nao_inclusos}}</pre>

<h2>4. Adicionais contratados</h2>
<pre>{{adicionais_contratados}}</pre>

<h2>5. Valores e pagamento</h2>
<ul>
  <li><strong>Valor do pacote:</strong> {{valor_pacote}}</li>
  <li><strong>Valor dos adicionais:</strong> {{valor_adicionais}}</li>
  <li><strong>Valor total:</strong> {{valor_total}}</li>
  <li><strong>Entrada:</strong> {{valor_entrada}}</li>
  <li><strong>Saldo:</strong> {{valor_saldo}}</li>
  <li><strong>Forma de pagamento da entrada:</strong> {{forma_pagamento_entrada}}</li>
  <li><strong>Forma de pagamento do saldo:</strong> {{forma_pagamento_saldo}}</li>
  <li><strong>Parcelamento:</strong> {{parcelas}} parcela(s)</li>
</ul>

<h2>6. Política de cancelamento</h2>
<p>{{politica_cancelamento}}</p>

<h2>7. Política de remarcação</h2>
<p>{{politica_remarcacao}}</p>

<h2>8. Observações</h2>
<p>{{observacoes}}</p>
<p>{{observacoes_festa}}</p>

<h2>9. Termos e autorizações</h2>
<pre>{{aceites}}</pre>

<h2>10. Aceite eletrônico</h2>
<p>O CONTRATANTE declara ter lido, compreendido e aceito integralmente as condições deste contrato, inclusive valores, forma de pagamento, data, horário, pacote contratado, políticas de cancelamento e remarcação e regras de uso do espaço.</p>
</article>`;

export const DEFAULT_CONTRACT_TEMPLATE_NAME = "Contrato padrão de festa infantil";
