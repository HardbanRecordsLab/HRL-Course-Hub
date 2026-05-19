import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const WP_REGISTER_URL = "https://hardbanrecordslab.online/rejestracja";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Rejestracja</h1>
        <p className="text-sm text-muted-foreground">
          Rejestracja odbywa się przez platformę WordPress.
        </p>
        <Button className="gap-2" onClick={() => window.location.href = WP_REGISTER_URL}>
          <ExternalLink className="w-4 h-4" /> Przejdź do rejestracji
        </Button>
        <p className="text-xs text-muted-foreground">
          Po rejestracji wróć tutaj i zaloguj się swoim tokenem JWT.
        </p>
      </div>
    </div>
  );
}
