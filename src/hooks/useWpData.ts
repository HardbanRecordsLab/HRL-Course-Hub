import { useQuery } from "@tanstack/react-query";
import { getWpConfig } from "@/lib/wpConfig";
import {
  users as mockUsers,
  courses as mockCourses,
  pmpro_levels as mockPmproLevels,
  recentActivity as mockActivity,
} from "@/lib/mockData";

const API_URL = import.meta.env.VITE_HRL_API_URL || "https://course-hub.hardbanrecordslab.online";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("hrl_jwt_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export function useIsWpConnected() {
  const cfg = getWpConfig();
  return !!cfg?.siteUrl;
}

export function useWpUsers(search?: string) {
  return useQuery({
    queryKey: ["ch-users", search],
    queryFn: async () => {
      try {
        const users = await apiFetch<any[]>(`/api/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        if (users.length > 0) return users.map((u: any) => ({ ...u, source: "api" as const }));
      } catch {
        // fall through to mock
      }
      let data = mockUsers;
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return data.map((u) => ({ ...u, source: "mock" as const }));
    },
    staleTime: 30_000,
  });
}

export function useWpCourses() {
  return useQuery({
    queryKey: ["ch-courses"],
    queryFn: async () => {
      try {
        const courses = await apiFetch<any[]>("/api/courses");
        if (courses.length > 0) {
          return courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            url: c.url,
            status: c.status,
            authMethod: c.authMethod || "jwt",
            pmpro_levels: c.pmpro_levels || [],
            activeUsers: c.activeUsers || 0,
            tokenExpiry: c.tokenExpiry || 86400,
            category: c.category || "",
            secretKey: c.secretKey || "",
            source: "api" as const,
          }));
        }
      } catch {
        // fall through
      }
      return mockCourses.map((c) => ({ ...c, source: "mock" as const }));
    },
    staleTime: 30_000,
  });
}

export function useWpPmproLevels() {
  return useQuery({
    queryKey: ["ch-plans"],
    queryFn: async () => {
      try {
        const plans = await apiFetch<any[]>("/api/plans");
        if (plans.length > 0) {
          return plans.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            source: "api" as const,
          }));
        }
      } catch {
        // fall through
      }
      return mockPmproLevels.map((l) => ({ ...l, source: "mock" as const }));
    },
    staleTime: 60_000,
  });
}

export function useTokens(status?: string, search?: string) {
  return useQuery({
    queryKey: ["ch-tokens", status, search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (status && status !== "all") params.set("status", status);
        if (search) params.set("search", search);
        params.set("limit", "200");
        return await apiFetch<any[]>(`/api/tokens?${params}`);
      } catch {
        const { tokens: mockTokens } = await import("@/lib/mockData");
        return mockTokens;
      }
    },
    staleTime: 15_000,
  });
}

export function useActivity(action?: string, search?: string) {
  return useQuery({
    queryKey: ["ch-activity", action, search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (action && action !== "all") params.set("action", action);
        if (search) params.set("search", search);
        params.set("limit", "200");
        return await apiFetch<any[]>(`/api/activity?${params}`);
      } catch {
        return mockActivity;
      }
    },
    staleTime: 10_000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["ch-dashboard-stats"],
    queryFn: async () => {
      try {
        return await apiFetch<any>("/api/dashboard/stats");
      } catch {
        return { activeUsers: 6, activeCourses: 3, draftCourses: 1, todayTokens: 5, plansCount: 4 };
      }
    },
    staleTime: 30_000,
  });
}
