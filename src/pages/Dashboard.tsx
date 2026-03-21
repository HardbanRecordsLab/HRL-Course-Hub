import { Users, BookOpen, Key, DollarSign, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { chartData, recentActivity, healthChecks, integrations } from "@/lib/mockData";
import { useWpUsers, useWpCourses, useWpPmproLevels, useIsWpConnected } from "@/hooks/useWpData";

const actionIcons: Record<string, { emoji: string; color: string }> = {
  "access.granted": { emoji: "🟢", color: "text-primary" },
  "token.issued": { emoji: "🔑", color: "text-ch-blue" },
  "token.failed": { emoji: "🔴", color: "text-ch-red" },
  "course.completed": { emoji: "🎉", color: "text-ch-amber" },
  "access.expired": { emoji: "⏰", color: "text-ch-amber" },
  "pmpro.level_changed": { emoji: "⬆️", color: "text-ch-purple" },
};

const actionLabels: Record<string, string> = {
  "access.granted": "Dostęp przyznany",
  "token.issued": "Token wydany",
  "token.failed": "Token odrzucony",
  "course.completed": "Kurs ukończony",
  "access.expired": "Dostęp wygasł",
  "pmpro.level_changed": "Zmiana poziomu",
};

export default function Dashboard() {
  const { data: wpUsers = [] } = useWpUsers();
  const { data: wpCourses = [] } = useWpCourses();
  const { data: wpLevels = [] } = useWpPmproLevels();
  const isWpConnected = useIsWpConnected();

  const activeUsers = wpUsers.filter(u => u.status === "active").length;
  const activeCourses = wpCourses.filter(c => c.status === "active").length;
  const draftCourses = wpCourses.filter(c => c.status === "draft").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Przegląd platformy HRL Course Hub</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isWpConnected ? (
            <span className="flex items-center gap-1.5 text-primary"><Wifi className="w-3.5 h-3.5" /> WP API</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground"><WifiOff className="w-3.5 h-3.5" /> Dane demo</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Aktywni użytkownicy" value={String(activeUsers)} change={isWpConnected ? "z WP" : "+12%"} color="green" delay={0} />
        <StatCard icon={BookOpen} label="Aktywne kursy" value={String(activeCourses)} change={draftCourses > 0 ? `${draftCourses} draft` : ""} changeType="neutral" color="blue" delay={0.05} />
        <StatCard icon={Key} label="Tokeny dziś" value="127" change="+23%" color="purple" delay={0.1} />
        <StatCard icon={DollarSign} label="PMPro Levels" value={String(wpLevels.length)} change={isWpConnected ? "z WP" : "4 poziomy"} color="amber" delay={0.15} />
      </div>

      {/* Chart + Activity */}
      <div className="grid lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 rounded-xl bg-card border border-border p-5"
        >
          <h3 className="text-sm font-semibold mb-4">Aktywność (7 dni)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 84%, 44%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 84%, 44%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(215, 90%, 58%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(215, 90%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 12%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210, 20%, 92%)",
                }}
              />
              <Area type="monotone" dataKey="tokeny" stroke="hsl(215, 90%, 58%)" fill="url(#gBlue)" strokeWidth={2} />
              <Area type="monotone" dataKey="dostępy" stroke="hsl(160, 84%, 44%)" fill="url(#gGreen)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-primary" /> Dostępy</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-ch-blue" /> Tokeny</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 rounded-xl bg-card border border-border p-5 overflow-hidden"
        >
          <h3 className="text-sm font-semibold mb-4">Ostatnia aktywność</h3>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {recentActivity.map((a) => {
              const info = actionIcons[a.action] || { emoji: "•", color: "text-muted-foreground" };
              return (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <span className="text-sm mt-0.5 flex-shrink-0">{info.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-foreground truncate">
                      <span className="font-medium">{a.user}</span>
                      <span className="text-muted-foreground"> · {actionLabels[a.action]}</span>
                    </p>
                    <p className="text-muted-foreground truncate">{a.course} · {a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Health + Integrations */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-card border border-border p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Health Check</h3>
          </div>
          <div className="space-y-3">
            {healthChecks.map((h) => (
              <div key={h.title} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${h.ok ? "bg-primary pulse-dot" : "bg-ch-red"}`} />
                  <div>
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">{h.url}</p>
                  </div>
                </div>
                <span className={`text-xs font-mono ${h.ok ? "text-primary" : "text-ch-red"}`}>
                  {h.ok ? `${h.ms}ms` : "DOWN"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-card border border-border p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Integracje</h3>
            <span className="ml-auto text-[11px] text-muted-foreground font-mono">{integrations.filter(i => i.enabled).length}/{integrations.length} aktywnych</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {integrations.slice(0, 8).map((i) => (
              <div key={i.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${i.enabled ? "bg-ch-surface-2 border-border" : "bg-muted/30 border-transparent"}`}>
                <span className="text-sm">{i.icon}</span>
                <span className={i.enabled ? "text-foreground" : "text-muted-foreground"}>{i.name}</span>
                {i.enabled && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto pulse-dot" />}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            + {integrations.length - 8} więcej integracji dostępnych
          </p>
        </motion.div>
      </div>
    </div>
  );
}
