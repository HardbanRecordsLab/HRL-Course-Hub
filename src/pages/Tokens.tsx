import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Key, Ban, Search, X, Copy } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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

const initialTokens: Token[] = [
  { id: 1, user: "Anna Kowalska", course: "Cyfrowy Zen", issuedAt: "2026-03-08 10:32", expiresAt: "2026-03-09 10:32", usedCount: 3, status: "active", ip: "91.198.x.x", jti: "tok_a1b2c3d4e5f6" },
  { id: 2, user: "Marcin Nowak", course: "Architekt Popytu 4.0", issuedAt: "2026-03-08 10:27", expiresAt: "2026-03-08 22:27", usedCount: 1, status: "active", ip: "83.12.x.x", jti: "tok_g7h8i9j0k1l2" },
  { id: 3, user: "Piotr Wiśniewski", course: "Cyfrowy Zen", issuedAt: "2026-03-08 10:20", expiresAt: "2026-03-09 10:20", usedCount: 0, status: "failed", ip: "185.43.x.x", jti: "tok_m3n4o5p6q7r8" },
  { id: 4, user: "Katarzyna Dąbrowska", course: "EFT po toksycznym związku", issuedAt: "2026-03-07 18:45", expiresAt: "2026-03-08 18:45", usedCount: 8, status: "expired", ip: "77.55.x.x", jti: "tok_s9t0u1v2w3x4" },
  { id: 5, user: "Tomasz Zieliński", course: "Cyfrowy Zen", issuedAt: "2026-03-08 09:10", expiresAt: "2026-03-09 09:10", usedCount: 2, status: "active", ip: "195.150.x.x", jti: "tok_y5z6a7b8c9d0" },
];

const statusTabs = [
  { id: "all", label: "Wszystkie" },
  { id: "active", label: "Aktywne" },
  { id: "expired", label: "Wygasłe" },
  { id: "failed", label: "Odrzucone" },
];

export default function Tokens() {
  const [tokens, setTokens] = useState(initialTokens);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [revokeDialog, setRevokeDialog] = useState<Token | null>(null);
  const { toast } = useToast();

  const stats = useMemo(() => ({
    active: tokens.filter(t => t.status === "active").length,
    today: tokens.length,
    failed: tokens.filter(t => t.status === "failed").length,
  }), [tokens]);

  const filtered = useMemo(() =>
    tokens.filter(t => {
      const matchSearch = !search || t.user.toLowerCase().includes(search.toLowerCase()) || t.course.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchStatus;
    }), [tokens, search, statusFilter]);

  const handleRevoke = () => {
    if (!revokeDialog) return;
    setTokens(prev => prev.map(t => t.id === revokeDialog.id ? { ...t, status: "revoked" } : t));
    toast({ title: "Token unieważniony", description: `Token ${revokeDialog.jti} został unieważniony` });
    setRevokeDialog(null);
  };

  const copyJti = (jti: string) => {
    navigator.clipboard.writeText(jti);
    toast({ title: "Skopiowano", description: "Token ID skopiowany do schowka" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tokeny JWT</h1>
        <p className="text-sm text-muted-foreground mt-1">Zarządzaj tokenami dostępu do kursów zewnętrznych</p>
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
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-ch-surface-2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium">{t.user}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{t.ip}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{t.course}</td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{t.issuedAt}</td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">{t.expiresAt}</td>
                  <td className="px-5 py-4 font-mono">{t.usedCount}</td>
                  <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {t.jti && (
                        <button onClick={() => copyJti(t.jti!)} className="text-muted-foreground hover:text-foreground transition-colors" title="Kopiuj Token ID">
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
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">Brak wyników</td></tr>
              )}
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
