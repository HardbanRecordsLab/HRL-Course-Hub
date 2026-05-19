import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useWpUsers, useWpCourses, useWpPmproLevels, useIsWpConnected } from "@/hooks/useWpData";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useWpUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("returns API users when API succeeds", async () => {
    const apiUsers = [
      { id: "1", email: "api@test.com", name: "API User", tier: "free" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiUsers,
    });
    const { result } = renderHook(() => useWpUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].email).toBe("api@test.com");
    expect(result.current.data?.[0].source).toBe("api");
  });

  it("falls back to mock data when API fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("API down"));
    const { result } = renderHook(() => useWpUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.data?.[0].source).toBe("mock");
  });
});

describe("useWpCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns API courses when API succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "c1", title: "API Course", slug: "api-course", status: "active" }],
    });
    const { result } = renderHook(() => useWpCourses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].title).toBe("API Course");
    expect(result.current.data?.[0].source).toBe("api");
  });

  it("falls back to mock when API fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("API down"));
    const { result } = renderHook(() => useWpCourses(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].source).toBe("mock");
  });
});

describe("useWpPmproLevels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns API plans when API succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "pro", name: "Pro", price: 297 }],
    });
    const { result } = renderHook(() => useWpPmproLevels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].name).toBe("Pro");
    expect(result.current.data?.[0].source).toBe("api");
  });

  it("falls back to mock when API fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("API down"));
    const { result } = renderHook(() => useWpPmproLevels(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].source).toBe("mock");
  });
});

describe("useIsWpConnected", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false when no WP config", () => {
    expect(useIsWpConnected()).toBe(false);
  });

  it("returns true when WP config has siteUrl", () => {
    localStorage.setItem("coursehub_wp_config", JSON.stringify({ siteUrl: "https://example.com", applicationPassword: "", jwtSecret: "" }));
    expect(useIsWpConnected()).toBe(true);
  });
});
