import type { EmailTemplateKey } from "./email-templates.ts";

interface SendTransactionalEmailInput {
  metadata?: Record<string, unknown>;
  params?: Record<string, unknown>;
  recipient: {
    email: string;
    name?: string | null;
  };
  templateKey: EmailTemplateKey;
  tenantId?: number | null;
}

export const sendTransactionalEmail = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  input: SendTransactionalEmailInput,
) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
    },
    method: "POST",
  });

  return response.json().catch(() => null);
};
