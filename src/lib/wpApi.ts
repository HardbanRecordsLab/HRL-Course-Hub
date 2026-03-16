import { getWpConfig, WpConfig } from "./wpConfig";

function getConfig(): WpConfig {
  const cfg = getWpConfig();
  if (!cfg?.siteUrl) throw new Error("WordPress nie jest skonfigurowany. Przejdź do Ustawienia → WordPress.");
  return cfg;
}

function headers(cfg: WpConfig): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (cfg.applicationPassword) {
    h["Authorization"] = `Basic ${cfg.applicationPassword}`;
  }
  return h;
}

async function wpFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cfg = getConfig();
  const url = `${cfg.siteUrl.replace(/\/+$/, "")}/wp-json${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers(cfg), ...options?.headers } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WP API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ——— Test connection ———
export async function testConnection(): Promise<{ name: string; description: string; url: string }> {
  const cfg = getConfig();
  const url = `${cfg.siteUrl.replace(/\/+$/, "")}/wp-json/`;
  const res = await fetch(url, { headers: headers(cfg) });
  if (!res.ok) throw new Error(`Nie można połączyć: ${res.status} ${res.statusText}`);
  return res.json();
}

// ——— Users ———
export interface WpUser {
  id: number;
  name: string;
  email?: string;
  slug: string;
  roles: string[];
  registered_date?: string;
  avatar_urls?: Record<string, string>;
}

export async function getUsers(params?: { per_page?: number; page?: number; search?: string; roles?: string }): Promise<WpUser[]> {
  const q = new URLSearchParams();
  if (params?.per_page) q.set("per_page", String(params.per_page));
  if (params?.page) q.set("page", String(params.page));
  if (params?.search) q.set("search", params.search);
  if (params?.roles) q.set("roles", params.roles);
  q.set("context", "edit");
  return wpFetch(`/wp/v2/users?${q}`);
}

export async function getUser(id: number): Promise<WpUser> {
  return wpFetch(`/wp/v2/users/${id}?context=edit`);
}

// ——— PMPro ———
export interface PmproLevel {
  id: number;
  name: string;
  description?: string;
  confirmation?: string;
  initial_payment?: string;
  billing_amount?: string;
  cycle_number?: number;
  cycle_period?: string;
}

export interface PmproMembership {
  id: number;
  user_id: number;
  membership_id: number;
  status: string;
  startdate: string;
  enddate: string | null;
}

export async function getPmproLevels(): Promise<PmproLevel[]> {
  return wpFetch("/pmpro/v1/membership_levels");
}

export async function getPmproMembers(params?: { level?: number; per_page?: number; page?: number }): Promise<PmproMembership[]> {
  const q = new URLSearchParams();
  if (params?.level) q.set("level", String(params.level));
  if (params?.per_page) q.set("per_page", String(params.per_page));
  if (params?.page) q.set("page", String(params.page));
  return wpFetch(`/pmpro/v1/members?${q}`);
}

export async function changePmproLevel(userId: number, levelId: number): Promise<unknown> {
  return wpFetch("/pmpro/v1/change_membership_level", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, level: levelId }),
  });
}

// ——— Posts / Courses (CPT) ———
export interface WpPost {
  id: number;
  title: { rendered: string };
  slug: string;
  status: string;
  link: string;
  meta?: Record<string, unknown>;
}

export async function getPosts(postType = "post", params?: { per_page?: number; page?: number; status?: string }): Promise<WpPost[]> {
  const q = new URLSearchParams();
  if (params?.per_page) q.set("per_page", String(params.per_page));
  if (params?.page) q.set("page", String(params.page));
  if (params?.status) q.set("status", params.status);
  return wpFetch(`/wp/v2/${postType}?${q}`);
}

// ——— JWT Auth (requires JWT plugin on WP) ———
export async function getJwtToken(username: string, password: string): Promise<{ token: string; user_email: string; user_display_name: string }> {
  const cfg = getConfig();
  const url = `${cfg.siteUrl.replace(/\/+$/, "")}/wp-json/jwt-auth/v1/token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Nieprawidłowe dane logowania WP");
  return res.json();
}
