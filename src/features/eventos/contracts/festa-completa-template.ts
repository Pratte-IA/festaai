export const FESTA_COMPLETA_TEMPLATE_HTML = `<article class="contract-document">
<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS E CESSÃO TEMPORÁRIA DE USO DE ESPAÇO PARA EVENTO</h1>

<p>Pelo presente instrumento particular, de um lado:</p>
<p><strong>{{nome_espaco}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob nº <strong>{{cnpj_espaco}}</strong>, com sede na {{endereco_completo_espaco}}, neste ato representada por <strong>{{nome_representante_espaco}}</strong>, CPF nº <strong>{{cpf_representante_espaco}}</strong>, doravante denominada <strong>CONTRATADA</strong>;</p>
<p>e, de outro lado:</p>
<p><strong>{{nome_contratante}}</strong>, brasileiro(a), inscrito(a) no CPF sob nº <strong>{{cpf_contratante}}</strong>, telefone {{telefone_contratante}}, e-mail {{email_contratante}}, residente e domiciliado(a) na {{endereco_completo_contratante}}, doravante denominado(a) <strong>CONTRATANTE</strong>;</p>
<p>têm entre si justo e contratado o presente instrumento, que será regido pelas cláusulas e condições abaixo.</p>

<h2>1. DO OBJETO</h2>
<p><strong>1.1.</strong> O presente contrato tem por objeto a cessão temporária de uso do espaço {{nome_espaco}}, bem como a prestação dos serviços contratados para realização de evento particular, conforme pacote escolhido pelo CONTRATANTE.</p>
<p><strong>1.2.</strong> A CONTRATADA cede o espaço fechado, denominado {{nome_espaco}}, para realização de evento na data {{data_evento}} às {{horario_inicio}}, devendo oferecer todos os itens negociados no pacote {{pacote_escolhido}} para a quantidade de {{numero_pessoas}} pessoas.</p>
<p><strong>1.3.</strong> O pacote contratado é o <strong>{{nome_pacote}}</strong>, para até <strong>{{quantidade_convidados_inclusa}}</strong> convidados, conforme itens descritos no Anexo I — Resumo da Contratação, que integra este contrato para todos os fins.</p>
<p><strong>1.4.</strong> Caso haja contratação de itens adicionais, serviços extras, convidados extras ou alterações no pacote, tais informações deverão constar no Anexo I ou em aditivo aceito pelas partes.</p>

<h2>2. DOS CONVIDADOS, CAPACIDADE E EXCEDENTES</h2>
<p><strong>2.1.</strong> O pacote contratado contempla até {{quantidade_convidados_inclusa}} convidados.</p>
<p><strong>2.2.</strong> Havendo convidados excedentes, será cobrado o valor de <strong>{{valor_convidado_extra}}</strong> por pessoa adicional, a partir de {{idade_cobranca_convidado_extra}} anos de idade.</p>
<p><strong>2.3.</strong> O CONTRATANTE poderá solicitar a inclusão de convidados extras até {{prazo_alteracao_convidados}} dias antes da data do evento, respeitada a capacidade máxima do espaço.</p>
<p><strong>2.4.</strong> A capacidade máxima do espaço é de <strong>{{capacidade_maxima_espaco}}</strong> pessoas, incluindo adultos, crianças, prestadores de serviço externos e demais presentes.</p>
<p><strong>2.5.</strong> A CONTRATADA poderá impedir a entrada de pessoas que excedam a capacidade máxima permitida, por motivo de segurança, conforto e regularidade da operação.</p>

<h2>3. DO VALOR E DAS CONDIÇÕES DE PAGAMENTO</h2>
<p><strong>3.1.</strong> O valor total contratado é de <strong>{{valor_total_contrato}}</strong>.</p>
<p><strong>3.2.</strong> Para reserva da data, o CONTRATANTE pagou ou deverá pagar o valor de <strong>{{valor_entrada}}</strong>, a título de sinal/reserva.</p>
<p><strong>3.3.</strong> O saldo remanescente de <strong>{{valor_saldo}}</strong> deverá ser pago até {{prazo_pagamento_saldo}} dias antes da data do evento.</p>
<p><strong>3.4.</strong> Os pagamentos poderão ser realizados pelos seguintes meios:</p>
<ul>
  <li><strong>Banco:</strong> {{banco}}</li>
  <li><strong>Agência:</strong> {{agencia}}</li>
  <li><strong>Conta:</strong> {{conta}}</li>
  <li><strong>PIX:</strong> {{chave_pix}}</li>
  <li><strong>Titular:</strong> {{titular_conta}}</li>
</ul>
<p><strong>3.5.</strong> O comprovante de pagamento deverá ser enviado pelo CONTRATANTE à CONTRATADA pelos canais oficiais de atendimento.</p>

<h2>4. DA DURAÇÃO DO EVENTO E HORÁRIO DE USO</h2>
<p><strong>4.1.</strong> O evento terá início às {{horario_inicio}} e encerramento às {{horario_termino}}.</p>
<p><strong>4.2.</strong> Será concedida tolerância de até {{tolerancia_encerramento}} minutos para encerramento e saída dos convidados.</p>
<p><strong>4.3.</strong> Ultrapassado o horário contratado e a tolerância prevista, poderá ser cobrada multa por hora excedente no valor de <strong>{{valor_hora_extra}}</strong>.</p>
<p><strong>4.4.</strong> Os serviços de buffet, monitoria, recepção, garçom e demais serviços operacionais contratados serão prestados pelo período de {{duracao_servicos_equipe}} horas.</p>

<h2>5. DAS OBRIGAÇÕES DA CONTRATADA</h2>
<p>A CONTRATADA compromete-se a disponibilizar o espaço em condições adequadas, fornecer os itens e serviços previstos no pacote contratado, preparar a decoração quando inclusa, comunicar situações que impactem o evento e zelar pela organização geral dentro dos limites dos serviços contratados.</p>

<h2>6. DAS OBRIGAÇÕES DO CONTRATANTE</h2>
<p>O CONTRATANTE compromete-se a realizar os pagamentos nos prazos previstos, informar corretamente os dados do evento, respeitar horários, orientar convidados, responsabilizar-se por danos causados ao espaço e bens da CONTRATADA, não fixar objetos sem autorização, não retirar itens do espaço, manter responsável adulto presente e comparecer ao final do evento para conferência.</p>

<h2>7. DAS CRIANÇAS, MONITORIA E SEGURANÇA</h2>
<p>A monitoria, quando contratada, tem função de apoio e recreação, não substituindo a responsabilidade dos pais ou responsáveis legais pelas crianças presentes no evento.</p>

<h2>8. DOS FORNECEDORES EXTERNOS</h2>
<p>A contratação de fornecedores externos dependerá das regras internas da CONTRATADA e deverá ser informada previamente. A CONTRATADA não se responsabiliza por serviços prestados diretamente por fornecedores externos contratados pelo CONTRATANTE.</p>

<h2>9. DOS ALIMENTOS, BEBIDAS E RESTRIÇÕES</h2>
<p>Os alimentos e bebidas fornecidos pela CONTRATADA serão aqueles descritos no pacote contratado ou em adicionais aceitos pelas partes. O CONTRATANTE deverá informar previamente eventuais restrições alimentares, alergias ou condições específicas dos convidados.</p>

<h2>10. DA DECORAÇÃO E DOS ITENS DO EVENTO</h2>
<p>A decoração será realizada conforme o tema escolhido pelo CONTRATANTE e de acordo com o padrão, acervo e disponibilidade da CONTRATADA. Itens pertencentes à CONTRATADA não poderão ser retirados do local.</p>

<h2>11. DO CANCELAMENTO, DESISTÊNCIA E REMARCAÇÃO</h2>
<p><strong>11.1.</strong> Em caso de desistência, o CONTRATANTE deverá comunicar formalmente a CONTRATADA pelos canais oficiais.</p>
<p><strong>11.2.</strong> O valor pago a título de sinal/reserva poderá ser retido pela CONTRATADA como compensação pela reserva da data.</p>
<p><strong>11.3.</strong> Cancelamento com antecedência igual ou superior a <strong>{{prazo_cancelamento_sem_multa_adicional}}</strong> dias: {{politica_cancelamento}}</p>
<p><strong>11.4.</strong> Cancelamento com antecedência inferior a <strong>{{prazo_cancelamento_com_multa}}</strong> dias poderá gerar multa de <strong>{{percentual_multa_cancelamento}}%</strong> sobre o valor total contratado.</p>
<p><strong>11.5.</strong> A remarcação estará sujeita à disponibilidade de agenda e deverá ocorrer dentro do prazo máximo de <strong>{{prazo_maximo_remarcacao}}</strong> meses: {{politica_remarcacao}}</p>

<h2>12. DOS DANOS, PERDAS E OBJETOS PESSOAIS</h2>
<p>A CONTRATADA não se responsabiliza por objetos pessoais deixados no espaço, salvo quando comprovada falha direta na guarda assumida pela CONTRATADA.</p>

<h2>13. DAS REGRAS DO ESPAÇO</h2>
<p>É proibido utilizar confetes, serpentinas, produtos inflamáveis, fogos, fumaça artificial, tintas, sprays, colas permanentes ou qualquer item que possa danificar o espaço, salvo autorização expressa.</p>

<h2>14. DO USO DE IMAGEM</h2>
<p>O CONTRATANTE poderá autorizar ou não o uso de imagens e vídeos do aniversariante e da família para fins de divulgação da CONTRATADA nas redes sociais. A divulgação do ambiente, decoração e itens da festa não depende desta autorização. Opção selecionada pelo CONTRATANTE: <strong>{{autoriza_uso_imagem}}</strong>.</p>

<h2>15. DA PROTEÇÃO DE DADOS PESSOAIS</h2>
<p>O CONTRATANTE declara ciência de que seus dados pessoais serão tratados pela CONTRATADA para fins de execução deste contrato, reserva de data, comunicação, cobrança, organização do evento e cumprimento de obrigações legais.</p>

<h2>16. DO ACEITE ELETRÔNICO</h2>
<p>O CONTRATANTE poderá aceitar este contrato por assinatura física, assinatura eletrônica, aceite em plataforma digital, confirmação por link, WhatsApp, e-mail ou outro meio capaz de comprovar sua manifestação de vontade.</p>

<h2>17. DAS DISPOSIÇÕES GERAIS</h2>
<p>Fica eleito o foro da comarca de <strong>{{comarca_foro}}</strong>, observadas as normas aplicáveis às relações de consumo.</p>
<p>E por estarem justas e contratadas, as partes aceitam o presente instrumento.</p>
<p>{{cidade_contrato}}, {{data_contrato}}.</p>

<h2>CONTRATANTE</h2>
<p>Nome: {{nome_contratante}}<br/>CPF: {{cpf_contratante}}</p>

<h2>CONTRATADA</h2>
<p>{{nome_espaco}}<br/>CNPJ: {{cnpj_espaco}}<br/>Representante: {{nome_representante_espaco}}</p>

<h2>ANEXO I — RESUMO DA CONTRATAÇÃO</h2>
<ul>
  <li><strong>Espaço contratado:</strong> {{nome_espaco}}</li>
  <li><strong>Data do evento:</strong> {{data_evento}}</li>
  <li><strong>Horário de início:</strong> {{horario_inicio}}</li>
  <li><strong>Horário de término:</strong> {{horario_termino}}</li>
  <li><strong>Duração total:</strong> {{duracao_evento}}</li>
  <li><strong>Tipo de evento:</strong> {{tipo_evento}}</li>
  <li><strong>Nome do aniversariante/evento:</strong> {{nome_aniversariante_ou_evento}}</li>
  <li><strong>Tema escolhido:</strong> {{tema_decoracao}}</li>
  <li><strong>Pacote contratado:</strong> {{nome_pacote}}</li>
  <li><strong>Quantidade de convidados inclusa:</strong> {{quantidade_convidados_inclusa}}</li>
  <li><strong>Capacidade máxima do espaço:</strong> {{capacidade_maxima_espaco}}</li>
  <li><strong>Valor por convidado extra:</strong> {{valor_convidado_extra}}</li>
  <li><strong>Idade considerada para cobrança de convidado extra:</strong> {{idade_cobranca_convidado_extra}} anos</li>
</ul>
<p><strong>Itens inclusos no pacote</strong></p>
<pre>{{itens_pacote_anexo}}</pre>
<h2>Condições comerciais</h2>
<ul>
  <li><strong>Valor total:</strong> {{valor_total_contrato}}</li>
  <li><strong>Entrada/sinal:</strong> {{valor_entrada}}</li>
  <li><strong>Saldo restante:</strong> {{valor_saldo}}</li>
  <li><strong>Data limite para pagamento do saldo:</strong> {{data_limite_pagamento}}</li>
  <li><strong>Forma de pagamento:</strong> {{forma_pagamento}}</li>
</ul>
</article>`;
