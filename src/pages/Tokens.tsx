import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Key, Ban, Search, X, Copy, Loader2, Wifi, WifiOff } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTokens, useIsWpConnected } from "@/hooks/useWpData";

interface Token {
  id: number;
  user: string;
  course: string;
  issuedAt: string;
  expiresAt: string;
  usedCount: number;
  status: string;
  ip: string;
  jti?: string;
}

const API_URL = import.meta.env.VITE_HRL_API_URL || "https://course-hub.hardbanrecordslab.online";

const formatTime = (t: string | undefined | null) => {
  if (!t) return "-";
  try { return new Date(t).toLocaleString("pl-PL"); } catch { return t; }
};

const statusTabs = [
  { id: "all", label: "Wszystkie" },
  { id: "active", label: "Aktywne" },
  { id: "expired", label: "Wygasłe" },
  { id: "failed", label: "Odrzucone" },
];

export default function Tokens() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [revokeDialog, setRevokeDialog] = useState<Token | null>(null);
  const { toast } = useToast();
  const isWpConnected = useIsWpConnected();
  const { data: tokens = [], isLoading, refetch } = useTokens(statusFilter, search || undefined);

  const stats = useMemo(() => ({
    active: tokens.filter((t: any) => t.status === "active").length,
    today: tokens.length,
    failed: tokens.filter((t: any) => t.status === "failed").length,
  }), [tokens]);

  const handleRevoke = async () => {
    if (!revokeDialog) return;
    try {
      const res = await fetch(`${API_URL}/api/tokens/${revokeDialog.id}/revoke`, { method: "POST" });
      if (res.ok) {
        toast({ title: "Token unieważniony", description: `Token został unieważniony` });
        refetch();
      } else {
        toast({ title: "Błąd", description: "Nie udało się unieważnić tokena", variant: "destructive" });
      }
    } catch {
      toast({ title: "Błąd", description: "Błąd połączenia z API", variant: "destructive" });
    }
    setRevokeDialog(null);
  };

  const copyJti = (jti: string) => {
    navigator.clipboard.writeText(jti);
    toast({ title: "Skopiowano", description: "Token ID skopiowany do schowka" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tokeny JWT</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj tokenami dostępu do kursów zewnętrznych</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isWpConnected ? (
            <span className="flex items-center gap-1.5 text-primary"><Wifi className="w-3.5 h-3.5" /> API</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground"><WifiOff className="w-3.5 h-3.5" /> Dane demo</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-2xl font-bold text-primary">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Aktywne tokeny</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-2xl font-bold text-ch-amber">{stats.today}</p>
          <p className="text-xs text-muted-foreground">Wydane dziś</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-2xl font-bold text-ch-red">{stats.failed}</p>
          <p className="text-xs text-muted-foreground">Odrzucone dziś</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj po użytkowniku lub kursie..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex gap-1.5">
          {statusTabs.map(t => (
            <button key={t.id} onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-ch-surface-2"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Użytkownik</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Kurs</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Wydany</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Wygasa</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Użycia</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />Ładowanie...</td></tr>
              )}
              {!isLoading && tokens.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">Brak wyników</td></tr>
              )}
              {tokens.map((t: any) => (
                <tr key={t.jti || t.id} className="border-b border-border/50 hover:bg-ch-surface-2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium">{t.user}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{t.ip || "-"}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{t.course}</td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{formatTime(t.issuedAt)}</td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{formatTime(t.expiresAt)}</td>
                  <td className="px-5 py-4 font-mono">{t.usedCount ?? 0}</td>
                  <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {t.jti && (
                        <button onClick={() => copyJti(t.jti)} className="text-muted-foreground hover:text-foreground transition-colors" title="Kopiuj Token ID">
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                      {t.status === "active" && (
                        <button onClick={() => setRevokeDialog(t)} className="flex items-center gap-1 text-xs text-ch-red hover:text-ch-red/80 transition-colors">
                          <Ban className="w-3 h-3" /> Unieważnij
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={!!revokeDialog} onOpenChange={() => setRevokeDialog(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Unieważnij token</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Czy na pewno chcesz unieważnić token dla <span className="font-medium text-foreground">{revokeDialog?.user}</span> na kurs <span className="font-medium text-foreground">{revokeDialog?.course}</span>?
          </p>
          {revokeDialog?.jti && <p className="text-xs font-mono text-muted-foreground">JTI: {revokeDialog.jti}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialog(null)}>Anuluj</Button>
            <Button variant="destructive" onClick={handleRevoke}>Unieważnij</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
