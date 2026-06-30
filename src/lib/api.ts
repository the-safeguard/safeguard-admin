// Control-plane data layer for the admin app. Typed via @the-safeguard/types.
// (The @the-safeguard/sdk client targets external consumers + the gateway stream;
// the dashboard uses these thin, mutation-capable wrappers.)

import type {
  ActivityEntry,
  DashboardKPIs,
  Integration,
  Policy,
  RiskAlert,
  UsagePoint,
  User,
} from "@the-safeguard/types";

export const CONTROL_PLANE_URL =
  import.meta.env.VITE_CONTROL_PLANE_URL ?? "http://localhost:8081";

const TOKEN_KEY = "sg_admin_token";

/** Broadcast so the AuthProvider can drop the session + redirect to /login. */
export const AUTH_EXPIRED_EVENT = "sg-auth-expired";
function signalExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Unix-seconds expiry from a JWT, or null if it can't be parsed. */
export function tokenExpiry(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/** True when there is no token, or the token's `exp` is in the past. */
export function isTokenExpired(): boolean {
  const t = auth.get();
  if (!t) return true;
  const exp = tokenExpiry(t);
  return exp != null && exp * 1000 <= Date.now();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = auth.get();
  // Don't fire a doomed request with a token we already know is expired —
  // drop the session immediately so the app redirects to /login.
  if (token && !path.startsWith("/auth/") && isTokenExpired()) {
    auth.clear();
    signalExpired();
    throw new Error("unauthorized");
  }
  const res = await fetch(`${CONTROL_PLANE_URL}/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    auth.clear();
    signalExpired();
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
}
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  auth.set(res.access_token);
  return res.user;
}

export async function register(
  orgName: string,
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ orgName, name, email, password }),
  });
  auth.set(res.access_token);
  return res.user;
}

// ── Metrics ──
export const getKpis = () => api<DashboardKPIs>("/metrics/kpis");
export const getUsage = () => api<UsagePoint[]>("/metrics/usage");
export interface QuotaStatus {
  plan: string;
  limit: number | null; // null = unlimited
  used: number;
  remaining: number | null;
  resetsAt: number; // unix seconds (next UTC midnight)
}
export const getQuota = () => api<QuotaStatus>("/metrics/quota");
export const getAlerts = () => api<RiskAlert[]>("/alerts");
export const getActivity = () => api<ActivityEntry[]>("/activity");

// ── Policies ──
export const getPolicies = () => api<Policy[]>("/policies");
export const createPolicy = (p: Partial<Policy>) =>
  api<Policy>("/policies", { method: "POST", body: JSON.stringify(p) });
export const updatePolicy = (id: string, p: Partial<Policy>) =>
  api<Policy>(`/policies/${id}`, { method: "PATCH", body: JSON.stringify(p) });
export const deletePolicy = (id: string) =>
  api<void>(`/policies/${id}`, { method: "DELETE" });

// ── Regional rule packs (optional detector packs, off by default) ──
export interface RulePackRule {
  pattern: string;
  label: string;
}
export interface RulePack {
  id: string;
  name: string;
  region: string;
  description: string;
  rules: RulePackRule[];
}
export const getRulePacks = () => api<RulePack[]>("/rule-packs");

// ── Users & teams ──
export interface CreatedMember extends User {
  inviteToken: string;
  inviteExpiresAt: string;
}
export const getUsers = () => api<User[]>("/users");
export const createUser = (u: { name: string; email: string; role: string; team: string }) =>
  api<CreatedMember>("/users", { method: "POST", body: JSON.stringify(u) });
export const updateUser = (
  id: string,
  u: Partial<{ name: string; role: string; status: string; team: string }>,
) => api<void>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(u) });
export const deleteUser = (id: string) =>
  api<void>(`/users/${id}`, { method: "DELETE" });

export interface InviteToken {
  inviteToken: string;
  expiresAt: string;
}
export const resendInvite = (id: string) =>
  api<InviteToken>(`/users/${id}/invite`, { method: "POST" });

export interface Team {
  id: string;
  name: string;
  memberCount: number;
}
export const getTeams = () => api<Team[]>("/teams");
export const createTeam = (name: string) =>
  api<Team>("/teams", { method: "POST", body: JSON.stringify({ name }) });
export const renameTeam = (id: string, name: string) =>
  api<void>(`/teams/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
export const deleteTeam = (id: string) =>
  api<void>(`/teams/${id}`, { method: "DELETE" });

// ── Invite acceptance (public) ──
export interface InvitePreview {
  name: string;
  email: string;
  orgName: string;
}
export const previewInvite = (token: string) =>
  api<InvitePreview>(`/auth/invite?token=${encodeURIComponent(token)}`);
export async function acceptInvite(token: string, password: string): Promise<AuthUser> {
  const res = await api<AuthResponse>("/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  auth.set(res.access_token);
  return res.user;
}

/// Build a shareable accept link for an invite token (admin copies + sends it).
export const inviteLink = (token: string) =>
  `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`;

// ── Logs ──
export interface LogRow {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  route: string;
  promptTokens: number;
  outputTokens: number;
  latencyMs: number;
  redactions: number;
  blocked: boolean;
}
export interface LogQuery {
  provider?: string;
  limit?: number;
  offset?: number;
}
export const getLogs = (q: LogQuery = {}) => {
  const params = new URLSearchParams();
  if (q.provider) params.set("provider", q.provider);
  if (q.limit != null) params.set("limit", String(q.limit));
  if (q.offset != null) params.set("offset", String(q.offset));
  const qs = params.toString();
  return api<LogRow[]>(`/logs${qs ? `?${qs}` : ""}`);
};

// ── Integrations ──
export const getIntegrations = () => api<Integration[]>("/integrations");
export const installIntegration = (slug: string) =>
  api<void>(`/integrations/${slug}/install`, { method: "PUT" });
export const uninstallIntegration = (slug: string) =>
  api<void>(`/integrations/${slug}/install`, { method: "DELETE" });
export const configureIntegration = (slug: string, url: string) =>
  api<void>(`/integrations/${slug}/config`, { method: "PATCH", body: JSON.stringify({ url }) });
export const testIntegration = (slug: string) =>
  api<void>(`/integrations/${slug}/test`, { method: "POST" });

// ── Shadow AI discovery ──
export interface DiscoveryRow {
  site: string;
  events: number;
  itemsCaught: number;
  blocked: number;
  redacted: number;
  lastSeen: string;
}
export interface LabelRow {
  label: string;
  count: number;
}
export interface ShadowEventRow {
  id: string;
  site: string;
  host: string;
  action: string;
  outcome: string;
  labels: string[];
  count: number;
  at: string;
}
export const getDiscovery = () => api<DiscoveryRow[]>("/discovery");
export const getDiscoveryLabels = () => api<LabelRow[]>("/discovery/labels");
export const getDiscoveryEvents = () => api<ShadowEventRow[]>("/discovery/events");

// ── Settings ──
export interface OrgSettings {
  orgName: string;
  plan: string;
  zeroRetention: boolean;
  settings: Record<string, unknown>;
}
export const getSettings = () => api<OrgSettings>("/org/settings");
export const updateSettings = (s: Partial<OrgSettings>) =>
  api<OrgSettings>("/org/settings", { method: "PATCH", body: JSON.stringify(s) });

// ── RAG knowledge base ──
export interface RagDocument {
  id: string;
  title: string;
  source: string | null;
  chunks: number;
  createdAt: string;
}
export interface RagIngestResult {
  id: string;
  title: string;
  chunks: number;
}
export interface RagSearchHit {
  documentId: string;
  title: string;
  content: string;
  score: number;
}
export const getRagDocuments = () => api<RagDocument[]>("/rag/documents");
export const ingestRagDocument = (d: { title: string; source?: string; content: string }) =>
  api<RagIngestResult>("/rag/documents", { method: "POST", body: JSON.stringify(d) });
export const deleteRagDocument = (id: string) =>
  api<void>(`/rag/documents/${id}`, { method: "DELETE" });
export const searchRag = (q: string, k = 5) =>
  api<RagSearchHit[]>(`/rag/search?q=${encodeURIComponent(q)}&k=${k}`);

// ── API / enrollment keys ──
export interface KeyInfo {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
  revoked: boolean;
}
export interface CreatedKey {
  id: string;
  name: string;
  key: string; // shown once
  prefix: string;
}
export const getKeys = () => api<KeyInfo[]>("/keys");
export const createKey = (name: string) =>
  api<CreatedKey>("/keys", { method: "POST", body: JSON.stringify({ name }) });
export const revokeKey = (id: string) => api<void>(`/keys/${id}`, { method: "DELETE" });
