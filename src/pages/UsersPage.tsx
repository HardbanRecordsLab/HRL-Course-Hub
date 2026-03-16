import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Mail, Clock, BookOpen, Key, Shield, Ban, CheckCircle2, UserCog, Loader2, Wifi, WifiOff } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { pmpro_levels, courses as allCourses } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useWpUsers, useIsWpConnected } from "@/hooks/useWpData";

interface User {
  id: number;
  name: string;
  email: string;
  level: string;
  courses: number;
  status: string;
  lastAccess: string;
  registeredAt: string;
  source: "mock" | "wp";
  accessHistory?: { course: string; date: string; action: string }[];
}

const actionLabels: Record<string, string> = {
  "access.granted": "Dostęp przyznany",
  "token.issued": "Token wydany",
  "token.failed": "Token odrzucony",
  "course.completed": "Kurs ukończony",
  "access.expired": "Dostęp wygasł",
};

const statusFilters = ["all", "active", "expired"];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const isWpConnected = useIsWpConnected();

  const { data: wpUsers = [], isLoading, isError } = useWpUsers(search || undefined);

  const filtered = useMemo(() =>
    wpUsers.filter(u => {
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesStatus;
    }), [wpUsers, statusFilter]);

  const openUser = (user: User) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const toggleUserStatus = (userId: number) => {
    toast({ title: "Status zmieniony", description: "Status użytkownika został zaktualizowany" });
  };

  const changeLevel = (userId: number, newLevel: string) => {
    toast({ title: "Poziom zmieniony", description: `Ustawiono: ${newLevel}` });
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, level: newLevel } : null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Użytkownicy</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj dostępami i historią użytkowników</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {isWpConnected ? (
            <span className="flex items-center gap-1.5 text-primary"><Wifi className="w-3.5 h-3.5" /> WP API</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground"><WifiOff className="w-3.5 h-3.5" /> Dane demo</span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj po emailu lub imieniu..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {statusFilters.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-ch-surface-2 hover:text-foreground"
              }`}>
              {f === "all" ? "Wszystkie" : f === "active" ? "Aktywne" : "Wygasłe"}
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
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Level</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Kursy</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ostatni dostęp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const level = pmpro_levels.find(l => l.name === u.level);
                return (
                  <tr key={u.id} onClick={() => openUser(u)} className="border-b border-border/50 hover:bg-ch-surface-2 transition-colors cursor-pointer">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded text-[11px] font-medium bg-ch-purple/10 text-ch-purple border border-ch-purple/20">
                        {u.level} {level && `· ${level.price} PLN`}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-muted-foreground">{u.courses}</td>
                    <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{u.lastAccess}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Brak wyników</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <p className="text-xs text-muted-foreground text-right">{isLoading ? "Ładowanie..." : `${filtered.length} z ${wpUsers.length} użytkowników`}</p>

      {/* User Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <div className="space-y-6 pt-2">
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                    {selectedUser.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <SheetTitle className="text-lg">{selectedUser.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground font-mono">{selectedUser.email}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-ch-surface-2 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <StatusBadge status={selectedUser.status} />
                </div>
                <div className="rounded-lg bg-ch-surface-2 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rejestracja</p>
                  <p className="text-sm font-mono">{selectedUser.registeredAt}</p>
                </div>
                <div className="rounded-lg bg-ch-surface-2 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Kursy</p>
                  <p className="text-sm font-bold">{selectedUser.courses}</p>
                </div>
                <div className="rounded-lg bg-ch-surface-2 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Ostatni dostęp</p>
                  <p className="text-sm">{selectedUser.lastAccess}</p>
                </div>
              </div>

              {/* Level management */}
              <div className="rounded-xl bg-ch-surface-2 border border-border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <UserCog className="w-3.5 h-3.5" /> Membership Level
                </p>
                <div className="flex flex-wrap gap-2">
                  {pmpro_levels.map(l => (
                    <button key={l.id} onClick={() => changeLevel(selectedUser.id, l.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedUser.level === l.name
                          ? "bg-ch-purple/10 text-ch-purple border border-ch-purple/20"
                          : "bg-card text-muted-foreground border border-border hover:border-ch-purple/30"
                      }`}>
                      {l.name} · {l.price} PLN
                    </button>
                  ))}
                </div>
              </div>

              {/* Access history */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Historia dostępów
                </p>
                <div className="space-y-2">
                  {(selectedUser.accessHistory || []).length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">Brak historii</p>
                  )}
                  {(selectedUser.accessHistory || []).map((h, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${h.action.includes("granted") || h.action.includes("completed") ? "bg-primary" : h.action.includes("failed") ? "bg-ch-red" : "bg-ch-blue"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{h.course}</p>
                        <p className="text-muted-foreground">{actionLabels[h.action] || h.action}</p>
                      </div>
                      <span className="text-muted-foreground font-mono flex-shrink-0">{h.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => toggleUserStatus(selectedUser.id)} variant={selectedUser.status === "active" ? "destructive" : "default"} className="gap-2">
                  {selectedUser.status === "active" ? <><Ban className="w-4 h-4" /> Zablokuj dostęp</> : <><CheckCircle2 className="w-4 h-4" /> Przywróć dostęp</>}
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => {
                  toast({ title: "Email wysłany", description: `Reset hasła wysłany do ${selectedUser.email}` });
                }}>
                  <Mail className="w-4 h-4" /> Wyślij reset hasła
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
