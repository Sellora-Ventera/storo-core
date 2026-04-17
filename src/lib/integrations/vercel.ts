/**
 * Vercel API wrapper for template preview deployment.
 *
 * Docs: https://vercel.com/docs/rest-api
 */

const VERCEL_API = "https://api.vercel.com";

export class VercelApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "VercelApiError";
  }
}

interface VercelConfig {
  token: string;
  teamId?: string;
}

function getConfig(): VercelConfig | null {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;
  return {
    token,
    teamId: process.env.VERCEL_TEAM_ID || undefined,
  };
}

function teamQuery(config: VercelConfig): string {
  return config.teamId ? `?teamId=${encodeURIComponent(config.teamId)}` : "";
}

function teamQueryAppend(config: VercelConfig, existingQuery: string): string {
  if (!config.teamId) return existingQuery;
  const separator = existingQuery.includes("?") ? "&" : "?";
  return `${existingQuery}${separator}teamId=${encodeURIComponent(config.teamId)}`;
}

async function vercelFetch<T>(
  config: VercelConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${VERCEL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* no-op */
  }

  if (!response.ok) {
    const errorMessage =
      (body as { error?: { message?: string } } | null)?.error?.message ||
      `Vercel API error ${response.status}`;
    throw new VercelApiError(errorMessage, response.status, body);
  }

  return body as T;
}

export interface CreateProjectInput {
  name: string;
  gitRepo: string; // "PTVENTERA-AI/storoengine"
  gitBranch?: string;
  framework?: string; // "nextjs"
  rootDirectory?: string;
}

export interface VercelProject {
  id: string;
  name: string;
  link?: { type: string; repo: string };
}

export async function createProject(input: CreateProjectInput): Promise<VercelProject> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  const body = {
    name: input.name,
    framework: input.framework ?? "nextjs",
    gitRepository: {
      type: "github",
      repo: input.gitRepo,
    },
    rootDirectory: input.rootDirectory ?? null,
  };

  return vercelFetch<VercelProject>(config, `/v10/projects${teamQuery(config)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface EnvVarInput {
  key: string;
  value: string;
  type?: "encrypted" | "plain";
  target?: Array<"production" | "preview" | "development">;
}

export async function setEnvVars(projectId: string, envs: EnvVarInput[]): Promise<void> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  const payload = envs.map((env) => ({
    key: env.key,
    value: env.value,
    type: env.type ?? "encrypted",
    target: env.target ?? ["production", "preview", "development"],
  }));

  await vercelFetch(
    config,
    `/v10/projects/${encodeURIComponent(projectId)}/env${teamQueryAppend(config, "?upsert=true")}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export interface DeploymentResult {
  id: string;
  url: string;
  readyState?: string;
}

export interface GitNamespace {
  provider: string;
  slug: string;
  id: number;
  installationId: number;
  name: string;
  ownerType: "user" | "team";
}

export interface SearchRepoResult {
  repos: Array<{
    id: number;
    name: string;
    slug: string;
    namespace?: string;
    provider: string;
    owner?: { id: number; name: string };
  }>;
}

/**
 * Resolve the numeric repoId required by the Vercel deployments API.
 * Vercel v13 /deployments requires `gitSource.repoId` (number), not `repo` (string).
 *
 * Process:
 *   1. List git-namespaces and find the one matching the owner slug
 *   2. Search repos within that namespace for matching name
 *   3. Return numeric id
 */
export async function resolveGitRepoId(
  ownerRepo: string,
  provider: "github" | "gitlab" | "bitbucket" = "github",
): Promise<number> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  const [owner, repoName] = ownerRepo.split("/");
  if (!owner || !repoName) {
    throw new VercelApiError(
      `Invalid repo format "${ownerRepo}". Expected "owner/name".`,
      400,
      null,
    );
  }

  // 1. List namespaces
  const namespaces = await vercelFetch<GitNamespace[]>(
    config,
    `/v4/integrations/git-namespaces?provider=${provider}`,
    { method: "GET" },
  );

  const namespace = namespaces.find(
    (n) => n.slug.toLowerCase() === owner.toLowerCase(),
  );
  if (!namespace) {
    throw new VercelApiError(
      `GitHub namespace "${owner}" not installed/connected in Vercel account. Install GitHub App for ${owner}.`,
      404,
      { availableNamespaces: namespaces.map((n) => n.slug) },
    );
  }

  // 2. Search repos within that namespace
  const result = await vercelFetch<SearchRepoResult>(
    config,
    `/v1/integrations/search-repo?provider=${provider}&namespaceId=${namespace.id}&query=${encodeURIComponent(repoName)}`,
    { method: "GET" },
  );

  const match = result.repos.find(
    (r) => r.name.toLowerCase() === repoName.toLowerCase(),
  );
  if (!match) {
    throw new VercelApiError(
      `Repo "${ownerRepo}" not found in Vercel namespace. Grant access via GitHub App settings.`,
      404,
      { searchedIn: namespace.slug, foundRepos: result.repos.map((r) => r.name) },
    );
  }

  return match.id;
}

export async function triggerDeployment(
  projectId: string,
  projectName: string,
  branch: string = "main",
  gitRepo: string = "PTVENTERA-AI/storoengine",
): Promise<DeploymentResult> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  const repoId = await resolveGitRepoId(gitRepo, "github");

  const body = {
    name: projectName,
    project: projectId,
    target: "production",
    gitSource: {
      type: "github",
      ref: branch,
      repoId,
    },
  };

  return vercelFetch<DeploymentResult>(config, `/v13/deployments${teamQuery(config)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface DeploymentStatus {
  id: string;
  url: string;
  state: "QUEUED" | "BUILDING" | "ERROR" | "INITIALIZING" | "READY" | "CANCELED";
  readyState?: string;
  errorMessage?: string;
  meta?: { githubCommitSha?: string };
}

export async function getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  return vercelFetch<DeploymentStatus>(
    config,
    `/v13/deployments/${encodeURIComponent(deploymentId)}${teamQuery(config)}`,
    { method: "GET" },
  );
}

export interface DomainVerificationChallenge {
  type: "TXT" | "CNAME";
  domain: string;
  value: string;
  reason?: string;
}

export interface AddDomainResult {
  name: string;
  verified: boolean;
  verification?: DomainVerificationChallenge[];
  apexName?: string;
  projectId?: string;
}

export async function addDomain(
  projectId: string,
  domain: string,
): Promise<AddDomainResult> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  return vercelFetch<AddDomainResult>(
    config,
    `/v10/projects/${encodeURIComponent(projectId)}/domains${teamQuery(config)}`,
    {
      method: "POST",
      body: JSON.stringify({ name: domain }),
    },
  );
}

/**
 * Get domain details including verification challenges.
 * Used to retry verification after DNS records are in place.
 */
export async function getProjectDomain(
  projectId: string,
  domain: string,
): Promise<AddDomainResult> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  return vercelFetch<AddDomainResult>(
    config,
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${teamQuery(config)}`,
    { method: "GET" },
  );
}

/**
 * Ask Vercel to re-verify the domain after DNS records are in place.
 */
export async function verifyProjectDomain(
  projectId: string,
  domain: string,
): Promise<AddDomainResult> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  return vercelFetch<AddDomainResult>(
    config,
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}/verify${teamQuery(config)}`,
    { method: "POST" },
  );
}

export async function deleteProject(projectId: string): Promise<void> {
  const config = getConfig();
  if (!config) throw new VercelApiError("VERCEL_API_TOKEN not configured", 500, null);

  try {
    await vercelFetch(
      config,
      `/v9/projects/${encodeURIComponent(projectId)}${teamQuery(config)}`,
      { method: "DELETE" },
    );
  } catch (err) {
    // Treat 404 as success — project already gone
    if (err instanceof VercelApiError && err.status === 404) return;
    throw err;
  }
}
