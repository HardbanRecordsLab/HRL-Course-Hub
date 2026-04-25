// src/integrations/supabase/client.ts
// HRL Bridge — zastępuje Supabase SDK wywołaniami do backendu VPS
// Feature: hrl-ecosystem-deployment
// Nie zawiera żadnych kluczy API ani sekretów

const MODULE_URL = (import.meta.env.VITE_ACCESS_MANAGER_URL as string)
  .replace("hrl-access", "course-hub");

interface HRLQueryBuilder {
  select: (columns?: string) => Promise<{ data: any; error: any }>;
  insert: (values: any) => Promise<{ data: any; error: any }>;
  update: (values: any) => HRLUpdateBuilder;
  delete: () => HRLDeleteBuilder;
}

interface HRLUpdateBuilder {
  eq: (column: string, value: any) => Promise<{ data: any; error: any }>;
}

interface HRLDeleteBuilder {
  eq: (column: string, value: any) => Promise<{ data: any; error: any }>;
}

class HRLBridge {
  from(table: string): HRLQueryBuilder {
    return {
      select: async (columns = "*") => {
        try {
          const res = await fetch(`${MODULE_URL}/api/${table}?select=${columns}`, {
            credentials: "include",
          });
          const data = await res.json();
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: err.message };
        }
      },
      insert: async (values: any) => {
        try {
          const res = await fetch(`${MODULE_URL}/api/${table}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(values),
          });
          const data = await res.json();
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: err.message };
        }
      },
      update: (values: any): HRLUpdateBuilder => ({
        eq: async (column: string, value: any) => {
          try {
            const res = await fetch(
              `${MODULE_URL}/api/${table}?${column}=${encodeURIComponent(value)}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(values),
              }
            );
            const data = await res.json();
            return { data, error: null };
          } catch (err: any) {
            return { data: null, error: err.message };
          }
        },
      }),
      delete: (): HRLDeleteBuilder => ({
        eq: async (column: string, value: any) => {
          try {
            await fetch(
              `${MODULE_URL}/api/${table}?${column}=${encodeURIComponent(value)}`,
              { method: "DELETE", credentials: "include" }
            );
            return { data: true, error: null };
          } catch (err: any) {
            return { data: null, error: err.message };
          }
        },
      }),
    };
  }

  auth = {
    getUser: async () => {
      try {
        const res = await fetch(`${MODULE_URL}/api/auth/me`, { credentials: "include" });
        if (!res.ok) return { data: { user: null }, error: "Unauthorized" };
        const user = await res.json();
        return { data: { user }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: err.message };
      }
    },
    signOut: async () => {
      try {
        await fetch(`${MODULE_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }
      return { error: null };
    },
  };
}

export const supabase = new HRLBridge();
