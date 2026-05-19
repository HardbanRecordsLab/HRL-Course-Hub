import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Download, Search, X, Filter, Loader2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useActivity, useIsWpConnected } from "@/hooks/useWpData";

const actionLabels: Record<string, string> = {
  "access.granted": "Dostęp przyznany",
  "token.issued": "Token wydany",
  "token.failed": "Token odrzucony",
  "course.completed": "Kurs ukończony",
  "access.expired": "Dostęp wygasł",
  "pmpro.level_changed": "Zmiana poziomu",
};

const actionColors: Record<string, string> = {
  "access.granted": "bg-primary/10 text-primary",
  "token.issued": "bg-ch-blue/10 text-ch-blue",
  "token.failed": "bg-ch-red/10 text-ch-red",
  "course.completed": "bg-ch-amber/10 text-ch-amber",
  "access.expired": "bg-ch-amber/10 text-ch-amber",
  "pmpro.level_changed": "bg-ch-purple/10 text-ch-purple",
};

const actionTypes = ["all", "access.granted", "token.issued", "token.failed", "course.completed", "access.expired", "pmpro.level_changed"];

const formatTime = (t: string | undefined | null) => {
  if (!t) return "-";
  try { return new Date(t).toLocaleString("pl-PL"); } catch { return t; }
};

export default function ActivityPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const isWpConnected = useIsWpConnected();
  const { data: activity = [], isLoading } = useActivity(actionFilter, search || undefined);

  const exportCSV = () => {
    const headers = ["ID", "Akcja", "Użytkownik", "Email", "Kurs", "Czas", "IP"];
    const rows = activity.map((a: any) => [a.id, a.action, a.user, a.email, a.course, a.time, a.ip]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Wyeksportowano", description: `${filtered.length} wpisów zapisano jako CSV` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aktywność</h1>
          <p className="text-sm text-muted-foreground mt-1">Pełny log zdarzeń platformy</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCSV}>
          <Download className="w-4 h-4" /> Eksport CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filtruj po akcji, użytkowniku..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4" /> Filtry
        </Button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap gap-1.5">
          {actionTypes.map(type => (
            <button key={type} onClick={() => setActionFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                actionFilter === type
                  ? (type === "all" ? "bg-primary/10 text-primary" : actionColors[type] || "bg-primary/10 text-primary")
                  : "text-muted-foreground hover:bg-ch-surface-2"
              }`}>
              {type === "all" ? "Wszystkie" : actionLabels[type] || type}
            </button>
          ))}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {isLoading && (
          <div className="py-12 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />Ładowanie...</div>
        )}
        {!isLoading && activity.map((a: any, i: number) => (
          <motion.div
            key={a.id || i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium ${actionColors[a.action] || "bg-muted text-muted-foreground"}`}>
              {a.action}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{a.user}</span>
                <span className="text-muted-foreground"> — {actionLabels[a.action]}</span>
              </p>
              <p className="text-xs text-muted-foreground">{a.course}</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{a.ip || "-"}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(a.time)}</span>
          </motion.div>
        ))}
        {!isLoading && activity.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">Brak pasujących wyników</div>
        )}
      </motion.div>

      <p className="text-xs text-muted-foreground text-right">{activity.length} zdarzeń</p>
      <div className="flex items-center gap-1.5 text-xs justify-end">
        {isWpConnected ? (
          <span className="flex items-center gap-1.5 text-primary"><Wifi className="w-3.5 h-3.5" /> API</span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground"><WifiOff className="w-3.5 h-3.5" /> Dane demo</span>
        )}
      </div>
    </div>
  );
}
