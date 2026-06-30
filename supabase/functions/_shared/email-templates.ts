export const emailTemplateKeys = [
  "welcome",
  "invite_member",
  "billing_payment_confirmed",
  "billing_boleto_due_reminder",
  "billing_overdue_24h",
  "billing_overdue_36h",
  "billing_overdue_blocked",
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
  String(params.appUrl ?? "https://app.festaai.com.br").replace(/\/$/, "");

const emailLayout = (params: Record<string, unknown>, content: string) => {
  const loginUrl = `${appUrl(params)}/login`;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">FestaAI</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Central de controle para casas de festas</p>
        </td></tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="padding:0 32px 28px;">
          <a href="${loginUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">Acessar o FestaAI</a>
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
      ${paragraph("Clique no botão abaixo e entre com este e-mail para continuar.")}
    `,
      ),
    text: (params) =>
      `${param(params, "inviterName", "Um administrador")} convidou você para acessar ${param(params, "tenantName", "sua empresa")} no FestaAI.`,
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
      ${highlightBox("Agora é hora de fazer seu primeiro acesso! Use o botão abaixo para entrar na plataforma com o e-mail cadastrado na contratação.")}
      ${paragraph("Se ainda não definiu sua senha, utilize a opção <strong>Esqueci minha senha</strong> na tela de login.")}
    `,
      ),
    text: (params) =>
      `Olá, ${param(params, "name", "tudo bem")}. Pagamento confirmado! Faça seu primeiro acesso em ${appUrl(params)}/login`,
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
      ${highlightBox("Para manter seu acesso ativo, realize o pagamento até a data de vencimento.")}
      ${params.checkoutUrl ? paragraph(`<a href="${escapeHtml(String(params.checkoutUrl))}" style="color:#7c3aed;">Acessar link de pagamento</a>`) : ""}
    `,
      ),
    text: (params) =>
      `Olá, ${param(params, "name", "tudo bem")}. Seu boleto FestaAI vence em ${param(params, "dueDate", "amanhã")}. Pague até a data para manter o acesso.`,
  },

  billing_overdue_24h: {
    subject: () => "Pagamento em atraso — regularize em até 48h",
    html: (params) =>
      emailLayout(
        params,
        `
      ${heading("Pagamento em atraso")}
      ${paragraph(`Olá, <strong>${escapeHtml(param(params, "name", "tudo bem"))}</strong>.`)}
      ${paragraph("Identificamos que o pagamento da sua assinatura FestaAI está em atraso há <strong>24 horas</strong>.")}
      ${highlightBox("Se o pagamento não for regularizado nas próximas <strong>48 horas</strong>, o acesso à plataforma será suspenso.")}
      ${params.checkoutUrl ? paragraph(`<a href="${escapeHtml(String(params.checkoutUrl))}" style="color:#7c3aed;">Regularizar pagamento agora</a>`) : paragraph("Acesse sua área de assinatura para regularizar o pagamento.")}
    `,
      ),
    text: (params) =>
      `Pagamento em atraso há 24h. Regularize em até 48h para evitar suspensão do acesso. ${param(params, "name", "")}`,
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
      ${params.checkoutUrl ? paragraph(`<a href="${escapeHtml(String(params.checkoutUrl))}" style="color:#7c3aed;">Pagar agora e evitar bloqueio</a>`) : ""}
    `,
      ),
    text: (params) =>
      `Pagamento em atraso há 36h. Em 12h (48h total) o acesso será suspenso. Regularize agora.`,
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
      ${highlightBox("Para reativar sua conta, regularize o pagamento pendente. Após a confirmação, o acesso será restabelecido automaticamente.")}
      ${params.checkoutUrl ? paragraph(`<a href="${escapeHtml(String(params.checkoutUrl))}" style="color:#7c3aed;">Regularizar pagamento e reativar acesso</a>`) : ""}
    `,
      ),
    text: (params) =>
      `Acesso bloqueado por atraso superior a 48h. Regularize o pagamento para reativar sua conta FestaAI.`,
  },
};
