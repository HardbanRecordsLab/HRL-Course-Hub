import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, Key, Activity, Settings, Zap, Menu, X, GraduationCap, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/courses", icon: BookOpen, label: "Kursy" },
  { to: "/users", icon: Users, label: "Użytkownicy" },
  { to: "/tokens", icon: Key, label: "Tokeny" },
  { to: "/activity", icon: Activity, label: "Aktywność" },
  { to: "/settings", icon: Settings, label: "Ustawienia" },
  { to: "/portal", icon: GraduationCap, label: "Portal ucznia" },
];

const studentNavItems = [
  { to: "/portal", icon: GraduationCap, label: "Moje kursy" },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === "admin" ? adminNavItems : studentNavItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg">
              <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">HRL Course Hub</h1>
              <p className="text-[10px] text-sidebar-foreground font-mono uppercase tracking-widest">
                {user?.role === "admin" ? "Manager v1.0" : "Portal ucznia"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/" || to === "/portal"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{user?.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Wyloguj się
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-md">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold text-foreground">HRL Course Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-muted-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border z-50 md:hidden pt-16"
          >
            <nav className="p-3 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/" || to === "/portal"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      {mobileOpen && <div className="fixed inset-0 bg-background/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0">
        <div className="p-4 md:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
