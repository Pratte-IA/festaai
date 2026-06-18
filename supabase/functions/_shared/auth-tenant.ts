import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

export const resolveAuthedTenantMember = async (
  req: Request,
  tenantId: number,
  options?: { requireAdmin?: boolean },
): Promise<AuthedTenantContext | Response> => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ ok: false, error: "Não autorizado." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jwt = authHeader.replace("Bearer ", "");
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const anonKey = requiredEnv("SUPABASE_ANON_KEY");

  const authedClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await authedClient.auth.getUser(jwt);

  if (userError || !user) {
    return new Response(JSON.stringify({ ok: false, error: "Sessão inválida." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const service = createServiceClient();

  const { data: membership, error: membershipError } = await service
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (!membership) {
    return new Response(JSON.stringify({ ok: false, error: "Você não pertence a este espaço." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const role = membership.role as TenantRole;

  if (options?.requireAdmin && role !== "owner" && role !== "admin") {
    return new Response(JSON.stringify({ ok: false, error: "Permissão insuficiente." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { authedClient, service, tenantId, user, role };
};
