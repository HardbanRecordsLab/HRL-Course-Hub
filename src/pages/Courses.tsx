import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ExternalLink, Users, Clock, Shield, Pencil, Trash2, Copy, Eye, EyeOff, RefreshCw, X, Wifi, WifiOff, Loader2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { pmpro_levels } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWpCourses, useIsWpConnected } from "@/hooks/useWpData";

interface Course {
  id: number;
  title: string;
  slug: string;
  url: string;
  status: "active" | "draft" | "archived";
  authMethod: "jwt" | "iframe" | "password" | "open";
  pmpro_levels: number[];
  activeUsers: number;
  tokenExpiry: number;
  category: string;
  secretKey?: string;
}

const initialCourses: Course[] = [
  { id: 1, title: "Cyfrowy Zen", slug: "cyfrowy-zen", url: "https://cyfrowy-zen.hardbanrecordslab.online", status: "active", authMethod: "jwt", pmpro_levels: [1, 2, 3, 4], activeUsers: 142, tokenExpiry: 86400, category: "Mindset", secretKey: "sk_cz_a8f3e2b1c9d4" },
  { id: 2, title: "EFT po toksycznym związku", slug: "magdalena-iskra", url: "https://magdalena-iskra.vercel.app", status: "active", authMethod: "jwt", pmpro_levels: [2, 3, 4], activeUsers: 87, tokenExpiry: 86400, category: "Terapia", secretKey: "sk_mi_7d2f4a9e1b3c" },
  { id: 3, title: "Architekt Popytu 4.0", slug: "architekt-popytu", url: "https://architekt-popytu.vercel.app", status: "active", authMethod: "jwt", pmpro_levels: [2, 3, 4], activeUsers: 215, tokenExpiry: 43200, category: "Marketing", secretKey: "sk_ap_5e1c3b7f9a2d" },
  { id: 4, title: "Kurs SEO Masterclass", slug: "seo-masterclass", url: "https://seo-masterclass.example.com", status: "draft", authMethod: "jwt", pmpro_levels: [3, 4], activeUsers: 0, tokenExpiry: 86400, category: "Marketing", secretKey: "sk_sm_2a9d4f6e8c1b" },
];

const authMethodLabels: Record<string, string> = {
  jwt: "JWT HS256",
  iframe: "iFrame",
  password: "Hasło",
  open: "Otwarta",
};

const categories = ["Mindset", "Terapia", "Marketing", "Rozwój", "Biznes", "Finanse"];

const emptyForm: Omit<Course, "id"> = {
  title: "", slug: "", url: "", status: "draft", authMethod: "jwt",
  pmpro_levels: [], activeUsers: 0, tokenExpiry: 86400, category: "Marketing", secretKey: "",
};

export default function Courses() {
  const { data: wpCourses, isLoading } = useWpCourses();
  const isWpConnected = useIsWpConnected();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showSecret, setShowSecret] = useState(false);
  const { toast } = useToast();

  // Sync from WP data when available
  useEffect(() => {
    if (wpCourses && wpCourses.length > 0) {
      setCourses(wpCourses.map(c => ({
        ...c,
        secretKey: (c as any).secretKey || "",
      })));
    }
  }, [wpCourses]);

  const openAdd = () => {
    setEditingCourse(null);
    setForm({ ...emptyForm, secretKey: generateKey() });
    setShowSecret(false);
    setDialogOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({ ...course });
    setShowSecret(false);
    setDialogOpen(true);
  };

  const openDelete = (course: Course) => {
    setDeletingCourse(course);
    setDeleteDialogOpen(true);
  };

  const generateKey = () => {
    const chars = "abcdef0123456789";
    let key = "sk_ch_";
    for (let i = 0; i < 12; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
  };

  const handleSave = () => {
    if (!form.title || !form.url) {
      toast({ title: "Błąd", description: "Tytuł i URL są wymagane", variant: "destructive" });
      return;
    }
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...form, id: editingCourse.id } : c));
      toast({ title: "Zaktualizowano", description: `Kurs "${form.title}" został zapisany` });
    } else {
      const newId = Math.max(...courses.map(c => c.id)) + 1;
      setCourses(prev => [...prev, { ...form, id: newId }]);
      toast({ title: "Dodano kurs", description: `"${form.title}" został utworzony` });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deletingCourse) return;
    setCourses(prev => prev.filter(c => c.id !== deletingCourse.id));
    toast({ title: "Usunięto", description: `Kurs "${deletingCourse.title}" został usunięty` });
    setDeleteDialogOpen(false);
    setDeletingCourse(null);
  };

  const toggleLevel = (levelId: number) => {
    setForm(prev => ({
      ...prev,
      pmpro_levels: prev.pmpro_levels.includes(levelId)
        ? prev.pmpro_levels.filter(id => id !== levelId)
        : [...prev.pmpro_levels, levelId],
    }));
  };

  const copySecret = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Skopiowano", description: "Secret key skopiowany do schowka" });
  };

  const toggleStatus = (courseId: number) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const next = c.status === "active" ? "draft" : c.status === "draft" ? "archived" : "active";
      return { ...c, status: next };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kursy</h1>
          <p className="text-sm text-muted-foreground mt-1">Zarządzaj kursami zewnętrznymi i mapowaniem PMPro</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {isWpConnected ? (
              <span className="flex items-center gap-1.5 text-primary"><Wifi className="w-3.5 h-3.5" /> WP API</span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground"><WifiOff className="w-3.5 h-3.5" /> Dane demo</span>
            )}
          </div>
          <Button className="gap-2" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Dodaj kurs
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {courses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-colors group"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-semibold truncate">{course.title}</h3>
                  <StatusBadge status={course.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <a href={course.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors font-mono truncate max-w-xs">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    {course.url}
                  </a>
                </div>

                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    {authMethodLabels[course.authMethod]}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {course.activeUsers} aktywnych
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    Token: {course.tokenExpiry / 3600}h
                  </span>
                  <span className="px-2 py-0.5 rounded bg-ch-surface-2 text-muted-foreground">{course.category}</span>
                  {course.secretKey && (
                    <button onClick={() => copySecret(course.secretKey!)} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <Copy className="w-3 h-3" />
                      <span className="font-mono">{course.secretKey.slice(0, 8)}...</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(course)} className="p-2 rounded-lg hover:bg-ch-surface-2 text-muted-foreground hover:text-foreground transition-colors" title="Edytuj">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleStatus(course.id)} className="p-2 rounded-lg hover:bg-ch-surface-2 text-muted-foreground hover:text-foreground transition-colors" title="Zmień status">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openDelete(course)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Usuń">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">PMPro Levels</p>
                  <div className="flex gap-1.5">
                    {pmpro_levels.map((l) => (
                      <span
                        key={l.id}
                        className={`px-2 py-1 rounded text-[11px] font-medium ${
                          course.pmpro_levels.includes(l.id)
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted/30 text-muted-foreground border border-transparent"
                        }`}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edytuj kurs" : "Dodaj nowy kurs"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tytuł kursu</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))}
                className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nazwa kursu" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Slug</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" placeholder="kurs-slug" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">URL kursu</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://kurs.example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Kategoria</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Autoryzacja</label>
                <select value={form.authMethod} onChange={e => setForm(f => ({ ...f, authMethod: e.target.value as Course["authMethod"] }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  {Object.entries(authMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Token expiry (sekundy)</label>
              <input type="number" value={form.tokenExpiry} onChange={e => setForm(f => ({ ...f, tokenExpiry: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px]" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Secret Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type={showSecret ? "text" : "password"} value={form.secretKey} onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, secretKey: generateKey() }))}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">PMPro Levels</label>
              <div className="flex gap-2">
                {pmpro_levels.map(l => (
                  <button key={l.id} onClick={() => toggleLevel(l.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.pmpro_levels.includes(l.id)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-ch-surface-2 text-muted-foreground border border-border hover:border-primary/30"
                    }`}>
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave}>{editingCourse ? "Zapisz zmiany" : "Dodaj kurs"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Czy na pewno chcesz usunąć kurs <span className="font-medium text-foreground">"{deletingCourse?.title}"</span>? Ta operacja jest nieodwracalna.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Anuluj</Button>
            <Button variant="destructive" onClick={handleDelete}>Usuń kurs</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
