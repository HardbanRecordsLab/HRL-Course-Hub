import { useEffect } from "react";

export default function AuthPage() {
  useEffect(() => {
    const returnUrl = encodeURIComponent(window.location.href);
    const wpLoginUrl = import.meta.env.VITE_WP_LOGIN_URL || "https://hardbanrecordslab.online/login";
    window.location.href = `${wpLoginUrl}?redirect_to=${returnUrl}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="text-center text-white/90">
        <p className="text-xl font-semibold">Redirecting to centralized login...</p>
        <p className="text-sm text-white/70 mt-3">Use WordPress SSO for authentication across the HRL ecosystem.</p>
      </div>
    </div>
  );
}