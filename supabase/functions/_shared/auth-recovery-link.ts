import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const optionalEnv = (key: string) => Deno.env.get(key) ?? "";

const appBaseUrl = () => (optionalEnv("APP_BASE_URL") || "https://festaai.com.br").replace(/\/$/, "");

export const findUserIdByEmail = async (supabase: SupabaseClient, email: string) => {
  const normalizedEmail = normalizeEmail(email);
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const match = data.users.find((user) => normalizeEmail(user.email ?? "") === normalizedEmail);
    if (match) return match;

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
};

export const generatePasswordRecoveryUrl = async (
  supabase: SupabaseClient,
  email: string,
  options: { firstAccess?: boolean } = {},
) => {
  const redirectPath = options.firstAccess
    ? "/nova-senha?origem=primeiro-acesso"
    : "/nova-senha";

  const { data, error } = await supabase.auth.admin.generateLink({
    email: normalizeEmail(email),
    options: {
      redirectTo: `${appBaseUrl()}${redirectPath}`,
    },
    type: "recovery",
  });

  if (error) throw error;

  const recoveryUrl = data.properties?.action_link;
  if (!recoveryUrl) {
    throw new Error("Nao foi possivel gerar o link de recuperacao de senha.");
  }

  return recoveryUrl;
};
