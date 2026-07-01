import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { findUserIdByEmail, generatePasswordRecoveryUrl } from "./auth-recovery-link.ts";

export interface OnboardBillingOwnerInput {
  email: string;
  fullName: string;
  cpf?: string | null;
  tenantId: number;
}

export interface OnboardBillingOwnerResult {
  createdUser: boolean;
  linkedExistingUser: boolean;
  setupPasswordUrl: string;
  userId: string;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const generateSetupPasswordUrl = async (supabase: SupabaseClient, email: string) =>
  generatePasswordRecoveryUrl(supabase, email, { firstAccess: true });

export const onboardBillingOwner = async (
  supabase: SupabaseClient,
  input: OnboardBillingOwnerInput,
): Promise<OnboardBillingOwnerResult> => {
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim() || "Cliente FestaAI";

  const { data: existingOwner } = await supabase
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", input.tenantId)
    .eq("role", "owner")
    .eq("status", "active")
    .maybeSingle();

  if (existingOwner?.user_id) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", existingOwner.user_id)
      .maybeSingle();

    const ownerEmail = normalizeEmail(ownerProfile?.email ?? email);
    const setupPasswordUrl = await generateSetupPasswordUrl(supabase, ownerEmail);

    return {
      createdUser: false,
      linkedExistingUser: false,
      setupPasswordUrl,
      userId: existingOwner.user_id,
    };
  }

  let userId = (await findUserIdByEmail(supabase, email))?.id ?? null;
  let createdUser = false;
  let linkedExistingUser = false;

  if (!userId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      throw createError ?? new Error("Nao foi possivel criar o usuario de acesso.");
    }

    userId = created.user.id;
    createdUser = true;
  } else {
    linkedExistingUser = true;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      cpf: input.cpf ?? null,
      email,
      full_name: fullName,
      id: userId,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    if (createdUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    throw profileError;
  }

  const { error: memberError } = await supabase.from("tenant_members").upsert(
    {
      role: "owner",
      status: "active",
      tenant_id: input.tenantId,
      user_id: userId,
    },
    { onConflict: "tenant_id,user_id" },
  );

  if (memberError) {
    if (createdUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    throw memberError;
  }

  const setupPasswordUrl = await generateSetupPasswordUrl(supabase, email);

  return {
    createdUser,
    linkedExistingUser,
    setupPasswordUrl,
    userId,
  };
};
