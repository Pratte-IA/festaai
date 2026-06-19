export const ALUGUEL_ESPACO_TEMPLATE_HTML = `<article class="contract-document">
<h1>CONTRATO DE LOCAÇÃO DE ESPAÇO PARA EVENTO COM SERVIÇOS BÁSICOS</h1>

<p>Pelo presente instrumento particular, de um lado:</p>
<p><strong>{{nome_espaco}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob nº <strong>{{cnpj_espaco}}</strong>, com sede localizada na {{endereco_completo_espaco}}, neste ato representada por <strong>{{nome_representante_espaco}}</strong>, CPF nº <strong>{{cpf_representante_espaco}}</strong>, doravante denominada <strong>LOCADORA</strong>;</p>
<p>e, de outro lado:</p>
<p><strong>{{nome_locatario}}</strong>, brasileiro(a), inscrito(a) no CPF sob nº <strong>{{cpf_locatario}}</strong>, telefone celular {{celular_locatario}}, e-mail {{email_locatario}}, residente e domiciliado(a) na {{endereco_completo_locatario}}, doravante denominado(a) <strong>LOCATÁRIO(A)</strong>;</p>
<p>têm entre si justo e contratado o presente instrumento particular, que será regido pelas cláusulas e condições abaixo.</p>

<h2>1. DO OBJETO DO CONTRATO</h2>
<p><strong>1.1.</strong> O presente contrato tem por objeto a cessão temporária de uso do espaço {{nome_espaco}}, bem como a prestação dos serviços contratados para realização de evento particular, conforme pacote escolhido pelo CONTRATANTE.</p>
<p><strong>1.2.</strong> A Locadora, como legítima proprietária, cede o espaço fechado, denominado {{nome_espaco}}, para realização de evento de confraternização a ser realizado na data {{data_evento}} às {{horario_inicio}}, devendo este oferecer todos os itens negociados no pacote {{pacote_escolhido}} pelo LOCATÁRIO, para a quantidade de {{numero_pessoas}} pessoas.</p>
<p><strong>1.3.</strong> O presente contrato refere-se exclusivamente à locação do espaço com serviços básicos, contemplando os seguintes itens:</p>
<ul>
  <li>uso do espaço durante o período contratado;</li>
  <li>limpeza padrão do espaço;</li>
  <li>demais itens descritos no Anexo I.</li>
</ul>
<p><strong>1.4.</strong> O LOCATÁRIO fica ciente de que o espaço possui capacidade máxima de <strong>{{capacidade_maxima_espaco}}</strong> pessoas, incluindo adultos, crianças, prestadores de serviço externos e demais presentes.</p>
<p><strong>1.5.</strong> A LOCADORA poderá impedir a entrada de pessoas que excedam a capacidade máxima permitida, por motivo de segurança, conforto, organização e regularidade da operação do espaço.</p>

<h2>2. DO VALOR E DAS CONDIÇÕES DE PAGAMENTO</h2>
<p><strong>2.1.</strong> O valor total da locação do espaço será de <strong>{{valor_total}}</strong>.</p>
<p><strong>2.2.</strong> Para reserva da data, o LOCATÁRIO pagou ou deverá pagar o valor de <strong>{{valor_entrada}}</strong>, a título de sinal/reserva.</p>
<p><strong>2.3.</strong> O saldo restante de <strong>{{valor_saldo}}</strong> deverá ser pago até {{prazo_pagamento_saldo}} dias antes da data do evento.</p>
<p><strong>2.4.</strong> Os pagamentos deverão ser realizados por transferência bancária, PIX ou outro meio aceito pela LOCADORA, conforme dados abaixo:</p>
<ul>
  <li><strong>Banco:</strong> {{banco}}</li>
  <li><strong>Agência:</strong> {{agencia}}</li>
  <li><strong>Conta:</strong> {{conta}}</li>
  <li><strong>PIX:</strong> {{chave_pix}}</li>
  <li><strong>Titular:</strong> {{titular_conta}}</li>
</ul>
<p><strong>2.5.</strong> O comprovante de pagamento deverá ser enviado pelo LOCATÁRIO à LOCADORA pelos canais oficiais de atendimento.</p>
<p><strong>2.6.</strong> O não pagamento do saldo no prazo previsto poderá impedir a realização do evento, sem prejuízo da aplicação das regras de desistência, cancelamento e remarcação previstas neste contrato.</p>

<h2>3. DA DURAÇÃO DO EVENTO E HORÁRIO DE USO</h2>
<p><strong>3.1.</strong> O evento terá início às {{horario_inicio}} e encerramento às {{horario_termino}} do dia {{data_evento}}.</p>
<p><strong>3.2.</strong> Será concedida tolerância de até {{tolerancia_encerramento}} minutos para encerramento das atividades, organização final e saída dos convidados.</p>
<p><strong>3.3.</strong> Ultrapassado o horário contratado e a tolerância prevista, poderá ser cobrada multa por hora excedente no valor de <strong>{{valor_hora_extra}}</strong>, proporcional ou integral, conforme regra da LOCADORA.</p>

<h2>4. DAS OBRIGAÇÕES DO LOCATÁRIO</h2>
<p>O LOCATÁRIO compromete-se a: realizar os pagamentos nos prazos previstos; respeitar os horários de início e término; informar corretamente a quantidade de convidados; orientar seus convidados quanto às regras de uso do espaço; responsabilizar-se por danos causados ao espaço e bens da LOCADORA; não fixar objetos em paredes, móveis ou estruturas sem autorização; não retirar itens do espaço; manter responsável adulto presente; e comparecer ao final do evento para conferência.</p>

<h2>5. DAS OBRIGAÇÕES DA LOCADORA</h2>
<p>A LOCADORA compromete-se a: disponibilizar o espaço em condições adequadas; disponibilizar mesas, cadeiras, toalhas, monitora e limpeza padrão conforme contratado; zelar pela organização geral; comunicar situações que impactem o evento; e realizar a limpeza padrão após o evento.</p>

<h2>6. DA MONITORA E DA RESPONSABILIDADE PELAS CRIANÇAS</h2>
<p>A monitora disponibilizada tem função de apoio e recreação, não substituindo a responsabilidade dos pais ou responsáveis legais pelas crianças presentes no evento.</p>

<h2>7. DOS ALIMENTOS, BEBIDAS E FORNECEDORES EXTERNOS</h2>
<p>Este contrato não inclui fornecimento de alimentos, bebidas, buffet, bolo, doces, salgados, descartáveis ou serviço de garçom, salvo quando expressamente previsto no Anexo I. O LOCATÁRIO será responsável por providenciar e retirar alimentos e bebidas que desejar utilizar, respeitadas as regras internas da LOCADORA.</p>

<h2>8. DA LIMPEZA E CONSERVAÇÃO DO ESPAÇO</h2>
<p>A limpeza padrão do espaço após o evento está inclusa neste contrato. Não está inclusa limpeza extraordinária decorrente de sujeira excessiva, danos ou situações que exijam serviço adicional, cujos custos poderão ser cobrados do LOCATÁRIO.</p>

<h2>9. DOS DANOS, PERDAS E OBJETOS PESSOAIS</h2>
<p>A LOCADORA não se responsabiliza por objetos pessoais deixados no espaço, salvo quando comprovada falha direta da LOCADORA. Danos causados ao patrimônio da LOCADORA serão avaliados e cobrados do LOCATÁRIO quando decorrentes de mau uso ou conduta inadequada.</p>

<h2>10. DAS REGRAS DO ESPAÇO</h2>
<p>É proibido utilizar confetes, serpentinas, produtos inflamáveis, fogos, fumaça artificial, tintas, sprays, colas permanentes, glitter ou qualquer item que possa danificar o espaço, salvo autorização expressa da LOCADORA.</p>

<h2>11. DA DESISTÊNCIA, CANCELAMENTO E REMARCAÇÃO</h2>
<p><strong>11.1.</strong> Em caso de desistência, o LOCATÁRIO deverá comunicar formalmente a LOCADORA pelos canais oficiais.</p>
<p><strong>11.2.</strong> O valor pago a título de sinal/reserva poderá ser retido pela LOCADORA como compensação pela reserva da data.</p>
<p><strong>11.3.</strong> Cancelamento com antecedência igual ou superior a <strong>{{prazo_cancelamento_sem_multa_adicional}}</strong> dias poderá ser ajustado conforme política comercial: {{politica_cancelamento}}</p>
<p><strong>11.4.</strong> Cancelamento com antecedência inferior a <strong>{{prazo_cancelamento_com_multa}}</strong> dias poderá gerar multa de <strong>{{percentual_multa_cancelamento}}%</strong> sobre o valor total contratado.</p>
<p><strong>11.5.</strong> A remarcação estará sujeita à disponibilidade de agenda e deverá ocorrer dentro do prazo máximo de <strong>{{prazo_maximo_remarcacao}}</strong> meses: {{politica_remarcacao}}</p>
<p><strong>11.6.</strong> Caso não haja confirmação de pagamento da entrada/sinal em até <strong>{{prazo_confirmacao_entrada}}</strong> dias após a pactuação deste contrato, a LOCADORA poderá liberar a data e considerar a contratação sem efeito.</p>

<h2>12. DA PROTEÇÃO DE DADOS PESSOAIS</h2>
<p>O LOCATÁRIO declara ciência de que seus dados pessoais serão tratados pela LOCADORA para fins de execução deste contrato, reserva de data, comunicação, cobrança, organização do evento e cumprimento de obrigações legais, conforme a legislação aplicável.</p>

<h2>13. DO ACEITE ELETRÔNICO</h2>
<p>O LOCATÁRIO poderá aceitar este contrato por assinatura física, assinatura eletrônica, aceite em plataforma digital, confirmação por link, WhatsApp, e-mail ou outro meio capaz de comprovar sua manifestação de vontade.</p>

<h2>14. DISPOSIÇÕES GERAIS</h2>
<p>Fica eleito o foro da comarca de <strong>{{comarca_foro}}</strong>, observadas as normas aplicáveis às relações de consumo.</p>
<p>E, por estarem assim justas e contratadas, as partes aceitam o presente contrato.</p>
<p>{{cidade_contrato}}, {{data_contrato}}.</p>

<h2>LOCATÁRIO(A)</h2>
<p>Nome: {{nome_locatario}}<br/>CPF: {{cpf_locatario}}</p>

<h2>LOCADORA</h2>
<p>{{nome_espaco}}<br/>CNPJ: {{cnpj_espaco}}<br/>Representante: {{nome_representante_espaco}}</p>

<h2>ANEXO I — RESUMO DA LOCAÇÃO</h2>
<ul>
  <li><strong>Espaço contratado:</strong> {{nome_espaco}}</li>
  <li><strong>Data do evento:</strong> {{data_evento}}</li>
  <li><strong>Horário de início:</strong> {{horario_inicio}}</li>
  <li><strong>Horário de término:</strong> {{horario_termino}}</li>
  <li><strong>Quantidade de convidados:</strong> {{quantidade_convidados}}</li>
  <li><strong>Capacidade máxima do espaço:</strong> {{capacidade_maxima_espaco}}</li>
  <li><strong>Valor total:</strong> {{valor_total}}</li>
  <li><strong>Entrada/sinal:</strong> {{valor_entrada}}</li>
  <li><strong>Saldo restante:</strong> {{valor_saldo}}</li>
  <li><strong>Data limite para pagamento do saldo:</strong> {{data_limite_pagamento}}</li>
  <li><strong>Forma de pagamento:</strong> {{forma_pagamento}}</li>
</ul>
<p><strong>Itens inclusos no pacote</strong></p>
<pre>{{itens_pacote_anexo}}</pre>
</article>`;
