import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

import { findUserIdByEmail, generatePasswordRecoveryUrl } from "../_shared/auth-recovery-link.ts";
import { sendTransactionalEmail } from "../_shared/send-transactional-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const bodySchema = z.object({
  tenantId: z.number().int().positive(),
  fullName: z.string().min(2).max(120),
  cpf: z.string().min(11).max(18),
  email: z.string().email().max(320),
  appRole: z.enum(["admin", "member"]),
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const normalizeCpf = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) {
    throw new Error("CPF deve conter 11 dígitos.");
  }
  return digits;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const mapAppRoleToTenantRole = (appRole: "admin" | "member") =>
  appRole === "admin" ? "admin" : "member";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Não autorizado." }, 401);
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");

    const authedClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: actor },
      error: actorError,
    } = await authedClient.auth.getUser(jwt);

    if (actorError || !actor) {
      return jsonResponse({ error: "Sessão inválida." }, 401);
    }

    const payload = bodySchema.parse(await req.json());
    const tenantId = payload.tenantId;
    const tenantRole = mapAppRoleToTenantRole(payload.appRole);
    const cpfDigits = normalizeCpf(payload.cpf);
    const email = normalizeEmail(payload.email);
    const fullName = payload.fullName.trim();

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: membership, error: membershipError } = await service
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", actor.id)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return jsonResponse({ error: "Você não pode gerenciar usuários deste tenant." }, 403);
    }

    const { data: cpfProfile } = await service
      .from("profiles")
      .select("id")
      .eq("cpf", cpfDigits)
      .maybeSingle();

    if (cpfProfile?.id) {
      const { data: sameTeam } = await service
        .from("tenant_members")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("user_id", cpfProfile.id)
        .eq("status", "active")
        .maybeSingle();

      if (sameTeam) {
        return jsonResponse({ error: "Já existe um usuário com este CPF na sua equipe." }, 409);
      }
    }

    let userId = (await findUserIdByEmail(service, email))?.id ?? null;
    let createdUser = false;

    if (!userId) {
      const { data: newAuthUser, error: createError } = await service.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, must_set_password: true },
      });

      if (createError || !newAuthUser.user) {
        const msg = createError?.message ?? "Não foi possível criar o usuário.";
        if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")) {
          return jsonResponse({ error: "Este e-mail já está cadastrado." }, 409);
        }
        return jsonResponse({ error: msg }, 400);
      }

      userId = newAuthUser.user.id;
      createdUser = true;
    } else {
      const { data: existingMember } = await service
        .from("tenant_members")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (existingMember) {
        return jsonResponse({ error: "Este e-mail já faz parte da sua equipe." }, 409);
      }
    }

    const { error: profileError } = await service.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        cpf: cpfDigits,
        email,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      if (createdUser) {
        await service.auth.admin.deleteUser(userId);
      }
      throw profileError;
    }

    const { error: memberError } = await service.from("tenant_members").insert({
      invited_by: actor.id,
      role: tenantRole,
      status: "active",
      tenant_id: tenantId,
      user_id: userId,
    });

    if (memberError) {
      if (createdUser) {
        await service.auth.admin.deleteUser(userId);
      }
      throw memberError;
    }

    const [{ data: tenant }, { data: inviterProfile }] = await Promise.all([
      service.from("tenants").select("name").eq("id", tenantId).maybeSingle(),
      service.from("profiles").select("full_name, email").eq("id", actor.id).maybeSingle(),
    ]);

    const setupPasswordUrl = await generatePasswordRecoveryUrl(service, email, { firstAccess: true });

    await sendTransactionalEmail(supabaseUrl, serviceRoleKey, {
      metadata: {
        invited_by: actor.id,
        trigger: "team_member_invite",
      },
      params: {
        ctaLabel: "Criar minha senha e acessar",
        ctaUrl: setupPasswordUrl,
        inviterName: inviterProfile?.full_name?.trim() || inviterProfile?.email || "Um administrador",
        setupPasswordUrl,
        tenantName: tenant?.name ?? "sua empresa",
      },
      recipient: {
        email,
        name: fullName,
      },
      templateKey: "invite_member",
      tenantId,
    });

    return jsonResponse({
      emailSent: true,
      userId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(
        { error: error.issues[0]?.message ?? "Dados inválidos. Verifique os campos enviados." },
        400,
      );
    }
    const message = error instanceof Error ? error.message : "Erro inesperado ao convidar usuário.";
    return jsonResponse({ error: message }, 400);
  }
});
