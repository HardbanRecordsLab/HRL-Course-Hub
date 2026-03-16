import { useQuery } from "@tanstack/react-query";
import { getWpConfig } from "@/lib/wpConfig";
import * as wpApi from "@/lib/wpApi";
import {
  users as mockUsers,
  courses as mockCourses,
  pmpro_levels as mockPmproLevels,
} from "@/lib/mockData";

/** Returns true if WP connection is configured */
export function useIsWpConnected() {
  const cfg = getWpConfig();
  return !!cfg?.siteUrl;
}

/** Fetch users from WP or fallback to mock */
export function useWpUsers(search?: string) {
  const connected = useIsWpConnected();

  return useQuery({
    queryKey: ["wp-users", search, connected],
    queryFn: async () => {
      if (!connected) {
        // Return mock data mapped to unified shape
        let data = mockUsers;
        if (search) {
          const q = search.toLowerCase();
          data = data.filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q)
          );
        }
        return data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          level: u.level,
          courses: u.courses,
          status: u.status,
          lastAccess: u.lastAccess,
          registeredAt: u.registeredAt,
          source: "mock" as const,
        }));
      }

      // Fetch from WP
      const wpUsers = await wpApi.getUsers({
        per_page: 100,
        search: search || undefined,
      });

      return wpUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email || "",
        level: u.roles?.[0] || "subscriber",
        courses: 0,
        status: "active" as const,
        lastAccess: "-",
        registeredAt: u.registered_date || "",
        source: "wp" as const,
      }));
    },
    staleTime: 30_000,
    retry: connected ? 2 : 0,
  });
}

/** Fetch courses — from mock for now (WP CPT can be customized) */
export function useWpCourses() {
  const connected = useIsWpConnected();

  return useQuery({
    queryKey: ["wp-courses", connected],
    queryFn: async () => {
      if (!connected) {
        return mockCourses.map((c) => ({ ...c, source: "mock" as const }));
      }

      // Try fetching custom post type 'courses', fallback to 'posts'
      try {
        const posts = await wpApi.getPosts("courses", {
          per_page: 100,
          status: "any",
        });
        return posts.map((p) => ({
          id: p.id,
          title: p.title.rendered,
          slug: p.slug,
          url: p.link,
          status: (p.status === "publish" ? "active" : "draft") as
            | "active"
            | "draft"
            | "archived",
          authMethod: "jwt" as const,
          pmpro_levels: [] as number[],
          activeUsers: 0,
          tokenExpiry: 86400,
          category: "",
          source: "wp" as const,
        }));
      } catch {
        // If CPT doesn't exist, return mock
        return mockCourses.map((c) => ({ ...c, source: "mock" as const }));
      }
    },
    staleTime: 30_000,
    retry: connected ? 2 : 0,
  });
}

/** Fetch PMPro levels */
export function useWpPmproLevels() {
  const connected = useIsWpConnected();

  return useQuery({
    queryKey: ["wp-pmpro-levels", connected],
    queryFn: async () => {
      if (!connected) {
        return mockPmproLevels.map((l) => ({ ...l, source: "mock" as const }));
      }

      try {
        const levels = await wpApi.getPmproLevels();
        return levels.map((l) => ({
          id: l.id,
          name: l.name,
          price: parseFloat(l.initial_payment || l.billing_amount || "0"),
          source: "wp" as const,
        }));
      } catch {
        return mockPmproLevels.map((l) => ({ ...l, source: "mock" as const }));
      }
    },
    staleTime: 60_000,
    retry: connected ? 2 : 0,
  });
}
