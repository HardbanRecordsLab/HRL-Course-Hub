import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, ExternalLink, Loader2 } from "lucide-react";

const WP_LOGIN_URL = import.meta.env.VITE_WP_LOGIN_URL || "https://hardbanrecordslab.online/login";
const APP_URL = "https://app-course-hub.hardbanrecordslab.online";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState("");

  const handleTokenLogin = async () => {
    if (!tokenInput.trim()) return;
    await login(tokenInput.trim());
    navigate("/");
  };

  const handleWpLogin = () => {
    window.location.href = `${WP_LOGIN_URL}?redirect_to=${encodeURIComponent(APP_URL)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">HRL Course Hub</h1>
          <p className="text-sm text-muted-foreground mt-2">Zaloguj się, aby zarządzać platformą</p>
        </div>

        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <Button className="w-full gap-2" onClick={handleWpLogin}>
            <ExternalLink className="w-4 h-4" /> Zaloguj przez WordPress
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">lub użyj tokena</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Wklej token JWT..."
              className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && handleTokenLogin()}
            />
            <Button className="w-full gap-2" onClick={handleTokenLogin} disabled={!tokenInput.trim() || isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isLoading ? "Weryfikacja..." : "Zaloguj"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
