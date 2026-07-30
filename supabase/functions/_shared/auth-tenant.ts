import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { jsonResponse } from "./cors.ts";

export type TenantRole = "owner" | "admin" | "member";

export interface AuthedTenantContext {
  authedClient: SupabaseClient;
  service: SupabaseClient;
  tenantId: number;
  user: User;
  role: TenantRole;
}

const requiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const createServiceClient = () => {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token.length > 0 ? token : null;
};

const createAuthedAnonClient = (jwt: string) => {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const anonKey = requiredEnv("SUPABASE_ANON_KEY");
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
};

/** Valida o JWT do usuário via Auth API (service role — mais confiável em Edge Functions). */
const resolveUserFromJwt = async (jwt: string): Promise<User | Response> => {
  const service = createServiceClient();
  const { data, error } = await service.auth.getUser(jwt);

  if (error || !data.user) {
    console.error("auth.getUser failed:", error?.message ?? "user missing");
    return jsonResponse({ ok: false, error: "Sessão inválida." }, 401);
  }

  return data.user;
};

export const resolveAuthedTenantMember = async (
  req: Request,
  tenantId: number,
  options?: { requireAdmin?: boolean },
): Promise<AuthedTenantContext | Response> => {
  const jwt = extractBearerToken(req);
  if (!jwt) {
    return jsonResponse({ ok: false, error: "Não autorizado." }, 401);
  }

  const userOrError = await resolveUserFromJwt(jwt);
  if (userOrError instanceof Response) return userOrError;
  const user = userOrError;

  const service = createServiceClient();
  const authedClient = createAuthedAnonClient(jwt);

  const { data: membership, error: membershipError } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (!membership) {
    return jsonResponse({ ok: false, error: "Você não pertence a este espaço." }, 403);
  }

  const role = membership.role as TenantRole;

  if (options?.requireAdmin && role !== "owner" && role !== "admin") {
    return jsonResponse({ ok: false, error: "Permissão insuficiente." }, 403);
  }

  return { authedClient, service, tenantId, user, role };
};

export interface AuthedPlatformAdminContext {
  authedClient: SupabaseClient;
  service: SupabaseClient;
  user: User;
}

export const resolveAuthedPlatformAdmin = async (
  req: Request,
): Promise<AuthedPlatformAdminContext | Response> => {
  const jwt = extractBearerToken(req);
  if (!jwt) {
    return jsonResponse({ ok: false, error: "Não autorizado." }, 401);
  }

  // Rejeita se o Bearer for a própria anon/service key (não é sessão de usuário).
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (jwt === anonKey || jwt === serviceKey) {
    return jsonResponse(
      { ok: false, error: "Sessão inválida. Faça login novamente no admin." },
      401,
    );
  }

  const userOrError = await resolveUserFromJwt(jwt);
  if (userOrError instanceof Response) return userOrError;
  const user = userOrError;

  const service = createServiceClient();
  const authedClient = createAuthedAnonClient(jwt);

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profile?.is_platform_admin) {
    return jsonResponse({ ok: false, error: "Permissão insuficiente." }, 403);
  }

  return { authedClient, service, user };
};
