import { n8nApiFetch } from "./n8n-api.ts";
import type { N8nWorkflowNode } from "./n8n-provision-types.ts";

export const FESTAI_POSTGRES_CREDENTIAL_NAME = "MEMORIA FESTA AI";

export interface PostgresConnectionConfig {
  database: string;
  host: string;
  password: string;
  port: number;
  user: string;
}

interface N8nPostgresCredentialOptions {
  allowUnauthorizedCerts: boolean;
  ssl: "allow" | "disable" | "require";
}

interface N8nCredentialSummary {
  id: string;
  name?: string;
  type?: string;
}

const normalizeLabel = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const parseSupabaseDbUrl = (rawUrl: string): PostgresConnectionConfig => {
  const url = new URL(rawUrl);
  const database = url.pathname.replace(/^\//, "") || "postgres";
  const user = decodeURIComponent(url.username || "postgres");
  const password = decodeURIComponent(url.password || "");

  if (!url.hostname || !password) {
    throw new Error("SUPABASE_DB_URL inválida: host ou senha ausentes.");
  }

  return {
    database,
    host: url.hostname,
    password,
    port: url.port ? Number(url.port) : 5432,
    user,
  };
};

export const resolveFestAiPostgresConfig = async (): Promise<PostgresConnectionConfig> => {
  const poolerUrl = Deno.env.get("SUPABASE_DB_POOLER_URL")?.trim();
  if (poolerUrl) return parseSupabaseDbUrl(poolerUrl);

  const dbUrl = Deno.env.get("SUPABASE_DB_URL")?.trim();
  if (dbUrl) {
    const direct = parseSupabaseDbUrl(dbUrl);
    return shouldUseDirectConnection() ? direct : await resolvePoolerConfigForN8n(direct);
  }

  const host = Deno.env.get("SUPABASE_DB_HOST")?.trim();
  const password = Deno.env.get("SUPABASE_DB_PASSWORD")?.trim();
  const user = Deno.env.get("SUPABASE_DB_USER")?.trim() ?? "postgres";
  const database = Deno.env.get("SUPABASE_DB_NAME")?.trim() ?? "postgres";
  const portRaw = Deno.env.get("SUPABASE_DB_PORT")?.trim() ?? "5432";
  const port = Number(portRaw);

  if (!host || !password || !Number.isFinite(port)) {
    throw new Error(
      "Configure SUPABASE_DB_URL ou SUPABASE_DB_HOST + SUPABASE_DB_PASSWORD para sincronizar a credencial Postgres do n8n.",
    );
  }

  const direct = { database, host, password, port, user };
  return shouldUseDirectConnection() ? direct : await resolvePoolerConfigForN8n(direct);
};

const extractProjectRef = (config: PostgresConnectionConfig): string | null => {
  const fromEnv = Deno.env.get("SUPABASE_PROJECT_REF")?.trim();
  if (fromEnv) return fromEnv;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  if (supabaseUrl) {
    try {
      const host = new URL(supabaseUrl).hostname;
      const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
      if (match?.[1]) return match[1];
    } catch {
      // ignore
    }
  }

  const match = config.host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  return match?.[1] ?? null;
};

const resolvePoolerRegion = () =>
  Deno.env.get("SUPABASE_DB_POOLER_REGION")?.trim() ??
  Deno.env.get("SUPABASE_REGION")?.trim() ??
  "sa-east-1";

const shouldUseDirectConnection = () =>
  (Deno.env.get("N8N_POSTGRES_USE_DIRECT") ?? "false").trim().toLowerCase() === "true";

/** Converte conexão direta (IPv6) em pooler Supavisor (IPv4) — necessário para n8n. */
export const toSupabasePoolerConfig = (
  direct: PostgresConnectionConfig,
  overrides?: Partial<Pick<PostgresConnectionConfig, "host" | "port" | "user">>,
): PostgresConnectionConfig => {
  const projectRef = extractProjectRef(direct);
  if (!projectRef) {
    throw new Error(
      "Não foi possível derivar SUPABASE_PROJECT_REF para montar a conexão pooler do Postgres.",
    );
  }

  const region = resolvePoolerRegion();
  const poolerHost =
    overrides?.host ??
    Deno.env.get("SUPABASE_DB_POOLER_HOST")?.trim() ??
    `aws-0-${region}.pooler.supabase.com`;

  const poolerPort = overrides?.port ?? Number(Deno.env.get("SUPABASE_DB_POOLER_PORT") ?? "5432");
  if (!Number.isFinite(poolerPort) || poolerPort <= 0) {
    throw new Error("SUPABASE_DB_POOLER_PORT inválida.");
  }

  const poolerUser =
    overrides?.user ??
    Deno.env.get("SUPABASE_DB_POOLER_USER")?.trim() ??
    (direct.user.includes(".") ? direct.user : `postgres.${projectRef}`);

  return {
    database: direct.database,
    host: poolerHost,
    password: direct.password,
    port: poolerPort,
    user: poolerUser,
  };
};

const buildPoolerCandidates = (direct: PostgresConnectionConfig): PostgresConnectionConfig[] => {
  const region = resolvePoolerRegion();
  const explicitHost = Deno.env.get("SUPABASE_DB_POOLER_HOST")?.trim();
  const hosts = explicitHost
    ? [explicitHost]
    : [
      `aws-0-${region}.pooler.supabase.com`,
      `aws-1-${region}.pooler.supabase.com`,
    ];

  const ports = [
    Number(Deno.env.get("SUPABASE_DB_POOLER_PORT") ?? "5432"),
    6543,
  ].filter((port, index, arr) => Number.isFinite(port) && port > 0 && arr.indexOf(port) === index);

  const candidates: PostgresConnectionConfig[] = [];
  for (const host of hosts) {
    for (const port of ports) {
      candidates.push(toSupabasePoolerConfig(direct, { host, port }));
    }
  }

  return candidates;
};

const testPostgresConnection = async (config: PostgresConnectionConfig): Promise<boolean> => {
  const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
  const client = new Client({
    database: config.database,
    hostname: config.host,
    password: config.password,
    port: config.port,
    tls: {
      caCertificates: [],
      enabled: true,
      enforce: false,
    },
    user: config.user,
  });

  try {
    await client.connect();
    await client.queryArray("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
};

const resolveIPv4Address = async (hostname: string): Promise<string | null> => {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return hostname;

  try {
    const records = await Deno.resolveDns(hostname, "A");
    return records.find((record) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(record)) ?? null;
  } catch {
    return null;
  }
};

/** Descobre pooler Supavisor funcional e, se possível, usa IP IPv4 (evita ENOTFOUND no n8n). */
export const discoverWorkingPoolerConfig = async (
  direct: PostgresConnectionConfig,
): Promise<PostgresConnectionConfig> => {
  for (const candidate of buildPoolerCandidates(direct)) {
    if (!(await testPostgresConnection(candidate))) continue;

    const ipv4 = await resolveIPv4Address(candidate.host);
    if (!ipv4) return candidate;

    const viaIp: PostgresConnectionConfig = { ...candidate, host: ipv4 };
    if (await testPostgresConnection(viaIp)) {
      return viaIp;
    }

    return candidate;
  }

  throw new Error(
    "Nenhum pooler Supabase respondeu. Defina SUPABASE_DB_POOLER_URL ou SUPABASE_DB_POOLER_HOST manualmente.",
  );
};

const resolvePoolerConfigForN8n = async (
  direct: PostgresConnectionConfig,
): Promise<PostgresConnectionConfig> => {
  if (Deno.env.get("SUPABASE_DB_POOLER_URL")?.trim()) {
    return parseSupabaseDbUrl(Deno.env.get("SUPABASE_DB_POOLER_URL")!.trim());
  }

  if (Deno.env.get("SUPABASE_DB_POOLER_HOST")?.trim()) {
    return toSupabasePoolerConfig(direct);
  }

  return await discoverWorkingPoolerConfig(direct);
};

const buildPostgresSslOptions = (): N8nPostgresCredentialOptions => {
  const sslMode = (Deno.env.get("N8N_POSTGRES_SSL") ?? "allow").trim().toLowerCase();
  const allowUnauthorizedCerts =
    (Deno.env.get("N8N_POSTGRES_ALLOW_UNAUTHORIZED_CERTS") ?? "true").trim().toLowerCase() === "true";

  if (sslMode === "require" || sslMode === "disable" || sslMode === "allow") {
    return { allowUnauthorizedCerts, ssl: sslMode };
  }

  return { allowUnauthorizedCerts: true, ssl: "allow" };
};

const buildPostgresCredentialData = (config: PostgresConnectionConfig) => {
  const sslOptions = buildPostgresSslOptions();
  const data: Record<string, unknown> = {
    allowUnauthorizedCerts: sslOptions.allowUnauthorizedCerts,
    database: config.database,
    host: config.host,
    maxConnections: 100,
    password: config.password,
    port: config.port,
    sshTunnel: false,
    user: config.user,
  };

  // n8n só aceita `ssl` quando allowUnauthorizedCerts=false.
  if (!sslOptions.allowUnauthorizedCerts) {
    data.ssl = sslOptions.ssl;
  }

  return data;
};

const listCredentials = async (): Promise<N8nCredentialSummary[]> => {
  const response = await n8nApiFetch<{ data?: N8nCredentialSummary[] }>("/credentials?limit=250");
  return response.data ?? [];
};

const findFestAiPostgresCredential = async (): Promise<N8nCredentialSummary | null> => {
  const explicitId = Deno.env.get("N8N_POSTGRES_CREDENTIAL_ID")?.trim();
  if (explicitId) {
    return { id: explicitId, name: FESTAI_POSTGRES_CREDENTIAL_NAME, type: "postgres" };
  }

  const explicitName = Deno.env.get("N8N_POSTGRES_CREDENTIAL_NAME")?.trim() ?? FESTAI_POSTGRES_CREDENTIAL_NAME;
  const credentials = await listCredentials();
  const postgresCredentials = credentials.filter((item) => (item.type ?? "").toLowerCase() === "postgres");

  const exact = postgresCredentials.find((item) => item.name === explicitName);
  if (exact?.id) return exact;

  const normalizedTarget = normalizeLabel(explicitName);
  return (
    postgresCredentials.find((item) => normalizeLabel(item.name ?? "") === normalizedTarget) ??
    postgresCredentials.find((item) => normalizeLabel(item.name ?? "").includes("memoria festa")) ??
    null
  );
};

const createFestAiPostgresCredential = async (
  config: PostgresConnectionConfig,
  name: string,
): Promise<N8nCredentialSummary> => {
  const created = await n8nApiFetch<N8nCredentialSummary>("/credentials", {
    body: JSON.stringify({
      data: buildPostgresCredentialData(config),
      name,
      type: "postgres",
    }),
    method: "POST",
  });

  if (!created.id) {
    throw new Error("N8N não retornou ID ao criar credencial Postgres MEMORIA FESTA AI.");
  }

  return created;
};

const updateFestAiPostgresCredential = async (
  credentialId: string,
  config: PostgresConnectionConfig,
  name: string,
) => {
  await n8nApiFetch(`/credentials/${credentialId}`, {
    body: JSON.stringify({
      data: buildPostgresCredentialData(config),
      name,
    }),
    method: "PATCH",
  });
};

/**
 * Cria ou atualiza a credencial Postgres compartilhada do FestaAI no n8n.
 */
export const syncFestAiPostgresCredential = async (): Promise<{
  connectionMode: "direct" | "pooler";
  credentialId: string;
  credentialName: string;
  host: string;
  port: number;
  user: string;
}> => {
  const config = await resolveFestAiPostgresConfig();
  const credentialName = Deno.env.get("N8N_POSTGRES_CREDENTIAL_NAME")?.trim() ?? FESTAI_POSTGRES_CREDENTIAL_NAME;
  const connectionMode = shouldUseDirectConnection() ? "direct" : "pooler";

  const existing = await findFestAiPostgresCredential();
  if (existing?.id) {
    await updateFestAiPostgresCredential(existing.id, config, credentialName);
    return {
      connectionMode,
      credentialId: existing.id,
      credentialName: existing.name ?? credentialName,
      host: config.host,
      port: config.port,
      user: config.user,
    };
  }

  const created = await createFestAiPostgresCredential(config, credentialName);
  return {
    connectionMode,
    credentialId: created.id,
    credentialName: created.name ?? credentialName,
    host: config.host,
    port: config.port,
    user: config.user,
  };
};

export const attachPostgresCredentialToMemoryNodes = (
  nodes: N8nWorkflowNode[],
  credential: { credentialId: string; credentialName: string },
): N8nWorkflowNode[] =>
  nodes.map((node) => {
    const type = node.type ?? "";
    if (!type.includes("memoryPostgresChat")) return node;

    return {
      ...node,
      credentials: {
        ...(node.credentials ?? {}),
        postgres: {
          id: credential.credentialId,
          name: credential.credentialName,
        },
      },
    };
  });
