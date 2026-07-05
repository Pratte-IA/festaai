export const emailTemplateKeys = [
  "welcome",
  "invite_member",
  "password_reset",
  "billing_payment_confirmed",
  "billing_boleto_issued",
  "billing_boleto_due_reminder",
  "billing_overdue_24h",
  "billing_overdue_36h",
  "billing_overdue_blocked",
  "billing_annual_adjustment",
  "billing_annual_adjustment_notice",
] as const;

export type EmailTemplateKey = (typeof emailTemplateKeys)[number];

export interface EmailTemplate {
  subject: (params: Record<string, unknown>) => string;
  html: (params: Record<string, unknown>) => string;
  text: (params: Record<string, unknown>) => string;
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const param = (params: Record<string, unknown>, key: string, fallback: string) =>
  String(params[key] ?? fallback);

const appUrl = (params: Record<string, unknown>) =>
  String(params.appUrl ?? "https://festaai.com.br").replace(/\/$/, "");

const defaultLogoUrl =
  "https://nuhnbqerbaqazkvmqufg.supabase.co/storage/v1/object/public/email-assets/logo-email.png";

const logoUrl = (params: Record<string, unknown>) =>
  String(params.logoUrl ?? defaultLogoUrl);

const emailLogoHeader = (logo: string) => `
        <tr>
          <td align="center" valign="top" style="padding:36px 40px 28px;border-bottom:1px solid #e4e4e7;">
            <img
              src="${logo}"
              alt="FestaAI"
              width="200"
              style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;width:200px;max-width:200px;height:auto;"
            />
          </td>
        </tr>`;

const emailLayout = (params: Record<string, unknown>, content: string) => {
  const loginUrl = `${appUrl(params)}/login`;
  const ctaUrl = String(params.ctaUrl ?? params.boletoUrl ?? params.setupPasswordUrl ?? loginUrl);
  const ctaLabel = String(params.ctaLabel ?? "Acessar o FestaAI");
  const logo = logoUrl(params);
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        ${emailLogoHeader(logo)}
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="padding:0 32px 28px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">${escapeHtml(ctaLabel)}</a>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
          <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
            Dúvidas? Responda este e-mail ou fale com <a href="mailto:contato@festaai.com.br" style="color:#7c3aed;">contato@festaai.com.br</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">${text}</p>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#18181b;">${text}</h1>`;

const highlightBox = (text: string) =>
  `<div style="margin:20px 0;padding:16px;background:#faf5ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;">
    <p style="margin:0;font-size:14px;line-height:1.6;color:#581c87;">${text}</p>
  </div>`;

export const emailTemplates: Record<EmailTemplateKey, EmailTemplate> = {
  welcome: {
    subject: () => "Bem-vindo ao FestaAI!",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Bem-vindo ao FestaAI!")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph("Ficamos muito felizes em ter você conosco! Sua contratação foi registrada com sucesso.")}
      ${highlightBox("Estamos verificando o pagamento. Assim que for confirmado, você receberá um novo e-mail com as instruções para fazer o primeiro acesso à sua conta.")}
      ${paragraph(`Plano contratado: <strong>${escapeHtml(param(params, "planName", "FestaAI"))}</strong>.`)}
      ${paragraph("Enquanto isso, fique à vontade para responder este e-mail se tiver qualquer dúvida.")}
    `,
      ),
    text: (params) =>
      `Olá, ${param(params, "name", "tudo bem")}. Bem-vindo ao FestaAI! Estamos verificando o pagamento e, assim que confirmado, você receberá um e-mail para fazer o primeiro acesso. Plano: ${param(params, "planName", "FestaAI")}.`,
  },

  invite_member: {
    subject: (params) => `Convite para acessar ${param(params, "tenantName", "FestaAI")}`,
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Você foi convidado para o FestaAI")}
      ${paragraph(`${escapeHtml(param(params, "inviterName", "Um administrador"))} convidou você para acessar <strong>${escapeHtml(param(params, "tenantName", "sua empresa"))}</strong>.`)}
      ${paragraph("Clique no botão abaixo para <strong>criar sua senha</strong> e começar a usar o painel com este e-mail.")}
      ${highlightBox("O link é pessoal e expira em <strong>24 horas</strong>. Se ele expirar, peça para um administrador reenviar o convite.")}
    `,
      ),
    text: (params) => {
      const setupUrl = String(params.setupPasswordUrl ?? params.ctaUrl ?? `${appUrl(params)}/login`);
      return `${param(params, "inviterName", "Um administrador")} convidou você para acessar ${param(params, "tenantName", "sua empresa")} no FestaAI. Crie sua senha: ${setupUrl}`;
    },
  },

  password_reset: {
    subject: () => "Redefina sua senha — FestaAI",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Redefinição de senha")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph("Recebemos uma solicitação para redefinir a senha da sua conta FestaAI.")}
      ${highlightBox("Clique no botão abaixo para <strong>criar uma nova senha</strong>. O link é pessoal e expira em <strong>24 horas</strong>.")}
      ${paragraph("Se você não solicitou esta alteração, ignore este e-mail. Sua senha atual continuará válida.")}
    `,
      ),
    text: (params) => {
      const resetUrl = String(params.resetPasswordUrl ?? params.ctaUrl ?? `${appUrl(params)}/login`);
      return `Olá, ${param(params, "name", "tudo bem")}. Redefina sua senha do FestaAI: ${resetUrl}`;
    },
  },

  billing_payment_confirmed: {
    subject: () => "Pagamento confirmado — faça seu primeiro acesso",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Pagamento confirmado!")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph("Seu pagamento foi confirmado e sua assinatura FestaAI está ativa.")}
      ${highlightBox("Clique no botão abaixo para <strong>criar sua senha</strong> e acessar a plataforma com o e-mail cadastrado na contratação.")}
      ${paragraph("O link é pessoal e expira em <strong>24 horas</strong>. Se precisar de um novo link, responda este e-mail.")}
    `,
      ),
    text: (params) => {
      const setupUrl = String(params.setupPasswordUrl ?? params.ctaUrl ?? `${appUrl(params)}/login`);
      return `Olá, ${param(params, "name", "tudo bem")}. Pagamento confirmado! Crie sua senha e acesse: ${setupUrl}`;
    },
  },

  billing_boleto_issued: {
    subject: () => "Seu boleto FestaAI está disponível",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Seu boleto está disponível")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph(`Geramos o boleto da <strong>${escapeHtml(param(params, "chargeLabel", "sua assinatura FestaAI"))}</strong>.`)}
      ${params.amountLabel ? paragraph(`Valor: <strong>${escapeHtml(String(params.amountLabel))}</strong>.`) : ""}
      ${highlightBox(`Vencimento em <strong>${escapeHtml(param(params, "dueDate", "conforme indicado no boleto"))}</strong>. Clique no botão abaixo para abrir o boleto e realizar o pagamento.`)}
      ${paragraph("Você também pode acessar o boleto a qualquer momento em <strong>Minha Assinatura</strong> dentro da plataforma FestaAI.")}
    `,
      ),
    text: (params) => {
      const boletoUrl = String(params.boletoUrl ?? params.ctaUrl ?? "");
      return `Olá, ${param(params, "name", "tudo bem")}. Seu boleto FestaAI (${param(params, "chargeLabel", "assinatura")}) vence em ${param(params, "dueDate", "conforme indicado")}. Abra e pague: ${boletoUrl}`;
    },
  },

  billing_boleto_due_reminder: {
    subject: () => "Lembrete: seu boleto vence amanhã — FestaAI",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Seu boleto vence amanhã")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph(`Lembramos que o boleto da sua assinatura FestaAI vence em <strong>${escapeHtml(param(params, "dueDate", "amanhã"))}</strong>.`)}
      ${highlightBox("Para manter seu acesso ativo, abra o boleto pelo botão abaixo e realize o pagamento até a data de vencimento.")}
    `,
      ),
    text: (params) => {
      const boletoUrl = String(params.boletoUrl ?? params.checkoutUrl ?? params.ctaUrl ?? "");
      return `Olá, ${param(params, "name", "tudo bem")}. Seu boleto FestaAI vence em ${param(params, "dueDate", "amanhã")}. Pague até a data: ${boletoUrl}`;
    },
  },

  billing_overdue_24h: {
    subject: () => "Pagamento em atraso — regularize em até 24h",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Pagamento em atraso")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph("Identificamos que o pagamento da sua assinatura FestaAI está em atraso há <strong>24 horas</strong>.")}
      ${highlightBox("Você tem mais <strong>24 horas</strong> para regularizar o pagamento. Ao completar <strong>48 horas de atraso</strong> no total, o acesso à plataforma será suspenso. Abra o boleto abaixo para pagar.")}
    `,
      ),
    text: (params) => {
      const boletoUrl = String(params.boletoUrl ?? params.checkoutUrl ?? params.ctaUrl ?? "");
      return `Pagamento em atraso há 24h. Regularize nas próximas 24h (48h no total) para evitar suspensão: ${boletoUrl}`;
    },
  },

  billing_overdue_36h: {
    subject: () => "Urgente: seu acesso será suspenso em 12 horas",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Atenção: prazo final se aproxima")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph("Seu pagamento está em atraso há <strong>36 horas</strong>.")}
      ${highlightBox("Ao completar <strong>48 horas de atraso</strong>, o acesso à plataforma FestaAI será <strong>suspenso automaticamente</strong>. Restam apenas <strong>12 horas</strong>.")}
    `,
      ),
    text: (params) => {
      const boletoUrl = String(params.boletoUrl ?? params.checkoutUrl ?? params.ctaUrl ?? "");
      return `Pagamento em atraso há 36h. Em 12h o acesso será suspenso. Pague agora: ${boletoUrl}`;
    },
  },

  billing_overdue_blocked: {
    subject: () => "Acesso bloqueado — pagamento em atraso",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Acesso à plataforma bloqueado")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph("Seu pagamento está em atraso há mais de <strong>48 horas</strong> e o acesso à plataforma FestaAI foi <strong>bloqueado</strong>.")}
      ${highlightBox("Para reativar sua conta, regularize o pagamento pendente pelo boleto abaixo. Após a confirmação, o acesso será restabelecido automaticamente.")}
    `,
      ),
    text: (params) => {
      const boletoUrl = String(params.boletoUrl ?? params.checkoutUrl ?? params.ctaUrl ?? "");
      return `Acesso bloqueado por atraso. Regularize pelo boleto: ${boletoUrl}`;
    },
  },

  billing_annual_adjustment: {
    subject: () => "Reajuste anual da mensalidade FestaAI",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Reajuste anual da mensalidade")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph(`Informamos o reajuste anual da mensalidade da <strong>${escapeHtml(param(params, "companyName", "sua casa de festas"))}</strong>, conforme contrato (${escapeHtml(param(params, "indexLabel", "IPCA"))}).`)}
      ${highlightBox(`Índice aplicado: <strong>${escapeHtml(param(params, "ratePercent", "0"))}%</strong><br/>Valor anterior: <strong>${escapeHtml(param(params, "previousMonthlyPrice", "—"))}</strong><br/>Novo valor: <strong>${escapeHtml(param(params, "newMonthlyPrice", "—"))}</strong><br/>Vigência a partir de: <strong>${escapeHtml(param(params, "effectiveDate", "—"))}</strong>`)}
      ${paragraph("As próximas cobranças da mensalidade serão emitidas com o novo valor. Dúvidas? Responda este e-mail.")}
    `,
      ),
    text: (params) =>
      `Reajuste anual FestaAI (${param(params, "indexLabel", "IPCA")} ${param(params, "ratePercent", "0")}%): de ${param(params, "previousMonthlyPrice", "—")} para ${param(params, "newMonthlyPrice", "—")} a partir de ${param(params, "effectiveDate", "—")}.`,
  },

  billing_annual_adjustment_notice: {
    subject: () => "FestaAI — aviso: reajuste da mensalidade em 30 dias",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Aviso prévio de reajuste da mensalidade")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph(`Conforme o contrato de licença FestaAI, informamos com <strong>${escapeHtml(param(params, "noticeDaysAhead", "30"))} dias de antecedência</strong> que a mensalidade de <strong>${escapeHtml(param(params, "companyName", "sua casa de festas"))}</strong> será reajustada pelo índice <strong>${escapeHtml(param(params, "indexLabel", "IPCA"))}</strong> (variação acumulada dos últimos 12 meses).`)}
      ${highlightBox(`<strong>Data prevista do reajuste:</strong> ${escapeHtml(param(params, "effectiveDate", "—"))}<br/><br/><strong>Mensalidade atual:</strong> ${escapeHtml(param(params, "previousMonthlyPrice", "—"))}<br/><strong>Nova mensalidade estimada:</strong> ${escapeHtml(param(params, "newMonthlyPrice", "—"))}<br/><strong>Índice estimado:</strong> ${escapeHtml(param(params, "ratePercent", "0"))}%`)}
      ${paragraph("A <strong>próxima cobrança da mensalidade</strong> após essa data será emitida automaticamente com o valor atualizado no Asaas. Não é necessária nenhuma ação sua, salvo se desejar revisar a forma de pagamento.")}
      ${paragraph("Este aviso cumpre o prazo contratual de comunicação prévia. Dúvidas? Responda este e-mail ou fale conosco em contato@festaai.com.br.")}
    `,
      ),
    text: (params) =>
      `FestaAI — aviso com ${param(params, "noticeDaysAhead", "30")} dias: em ${param(params, "effectiveDate", "—")} a mensalidade de ${param(params, "companyName", "sua casa de festas")} passará de ${param(params, "previousMonthlyPrice", "—")} para ${param(params, "newMonthlyPrice", "—")} (IPCA ${param(params, "ratePercent", "0")}%). A próxima cobrança será emitida com o novo valor.`,
  },
};
