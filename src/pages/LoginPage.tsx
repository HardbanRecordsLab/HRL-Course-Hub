import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    const returnUrl = encodeURIComponent(window.location.href);
    const wpLoginUrl = import.meta.env.VITE_WP_LOGIN_URL || "https://hardbanrecordslab.online/login";
    window.location.href = `${wpLoginUrl}?redirect_to=${returnUrl}`;
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-base text-foreground">Redirecting to centralized login...</p>
      </div>
    </div>
  );
}
