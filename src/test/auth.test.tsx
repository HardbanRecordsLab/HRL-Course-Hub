import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import React from "react";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{auth.isAuthenticated ? "logged-in" : "logged-out"}</span>
      <span data-testid="auth-loading">{auth.isLoading ? "loading" : "done"}</span>
      <span data-testid="auth-error">{auth.error || ""}</span>
      {auth.user && <span data-testid="auth-email">{auth.user.email}</span>}
    </div>
  );
}

function renderApp() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, "", window.location.pathname);
  });

  it("shows logged-out when no token exists", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByTestId("auth-loading").textContent).toBe("done");
    });
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
  });

  it("extracts token from URL and calls verify", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: "test@test.com", name: "Test User", is_superuser: false }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "u1", email: "test@test.com", name: "Test User", role: "student", tier: "free", is_premium: false }),
    });
    window.history.replaceState({}, "", "?token=test-jwt-123");
    renderApp();
    await waitFor(() => {
      expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");
    });
    expect(localStorage.getItem("hrl_jwt_token")).toBe("test-jwt-123");
    expect(screen.getByTestId("auth-email").textContent).toBe("test@test.com");
  });

  it("falls back to logged-out when verify fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    localStorage.setItem("hrl_jwt_token", "bad-token");
    renderApp();
    await waitFor(() => {
      expect(screen.getByTestId("auth-loading").textContent).toBe("done");
    });
    expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
  });
});
