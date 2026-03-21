import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Clock, CheckCircle2, BookOpen, Star, ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface StudentCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  url: string;
  category: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: string;
  expiresAt: string | null;
  status: "active" | "completed";
  thumbnail: string;
  rating?: number;
}

const initialCourses: StudentCourse[] = [
  { id: 1, title: "Cyfrowy Zen", slug: "cyfrowy-zen", description: "Przestań się rozpraszać. Zacznij żyć świadomie w cyfrowym świecie.", url: "https://cyfrowy-zen.hardbanrecordslab.online", category: "Mindset", progress: 72, totalLessons: 18, completedLessons: 13, lastAccessed: "2 godz. temu", expiresAt: null, status: "active", thumbnail: "🧘" },
  { id: 2, title: "Architekt Popytu 4.0", slug: "architekt-popytu", description: "Zbuduj system pozyskiwania klientów, który pracuje za Ciebie 24/7.", url: "https://architekt-popytu.hardbanrecordslab.online", category: "Marketing", progress: 35, totalLessons: 24, completedLessons: 8, lastAccessed: "wczoraj", expiresAt: "2026-06-15", status: "active", thumbnail: "🚀" },
  { id: 3, title: "EFT po toksycznym związku", slug: "magdalena-iskra", description: "Uwolnij się od emocjonalnych blokad i odbuduj wewnętrzną siłę.", url: "https://magdalena-iskra.hardbanrecordslab.online", category: "Terapia", progress: 100, totalLessons: 12, completedLessons: 12, lastAccessed: "3 dni temu", expiresAt: null, status: "completed", thumbnail: "💎" },
];

const user = { firstName: "Anna", lastName: "Kowalska", email: "anna@example.com", level: "Pro", memberSince: "marzec 2025" };

export default function StudentPortal() {
  const [courses, setCourses] = useState(initialCourses);
  const [copied, setCopied] = useState(false);
  const [ratingDialog, setRatingDialog] = useState<StudentCourse | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const { toast } = useToast();

  const copyLink = () => {
    navigator.clipboard.writeText("https://app-course-hub.hardbanrecordslab.online/?ref=anna-k");
    setCopied(true);
    toast({ title: "Skopiowano!", description: "Link afiliacyjny skopiowany do schowka" });
    setTimeout(() => setCopied(false), 2000);
  };

  const rateCourse = (courseId: number, rating: number) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, rating } : c));
    toast({ title: "Dziękujemy!", description: `Oceniłeś kurs na ${rating}/5 ⭐` });
    setRatingDialog(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Witaj, <span className="text-primary">{user.firstName}</span> 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Plan: <span className="text-ch-purple font-medium">{user.level}</span> · Członek od {user.memberSince}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{courses.filter(c => c.status === "active").length} aktywne kursy</p>
                <p className="text-xs text-muted-foreground">{courses.filter(c => c.status === "completed").length} ukończone</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Moje kursy
        </h2>

        <div className="grid gap-5">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl bg-card border hover:border-primary/30 transition-all group ${
                course.status === "completed" ? "border-primary/20" : "border-border"
              }`}
            >
              <div className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-ch-surface-2 border border-border flex items-center justify-center text-2xl flex-shrink-0">
                    {course.thumbnail}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold">{course.title}</h3>
                          {course.status === "completed" && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                              <CheckCircle2 className="w-3 h-3" /> Ukończony
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-ch-surface-2">{course.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.lastAccessed}</span>
                      <span>{course.completedLessons}/{course.totalLessons} lekcji</span>
                      {course.expiresAt && <span className="text-ch-amber">Wygasa: {new Date(course.expiresAt).toLocaleDateString("pl-PL")}</span>}
                      {!course.expiresAt && course.status !== "completed" && <span className="text-primary">Bezterminowy</span>}
                      {course.rating && (
                        <span className="flex items-center gap-0.5 text-ch-amber">
                          {Array.from({ length: course.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-ch-amber" />)}
                          <span className="ml-1 text-muted-foreground">{course.rating}/5</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Postęp</span>
                        <span className={`text-xs font-mono font-medium ${course.progress === 100 ? "text-primary" : "text-foreground"}`}>
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-ch-surface-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ delay: i * 0.08 + 0.3, duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${course.progress === 100 ? "bg-primary" : "bg-gradient-to-r from-primary to-ch-blue"}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch md:items-end gap-2 flex-shrink-0 md:ml-4">
                    {course.status === "completed" ? (
                      <>
                        <Button variant="outline" className="gap-2 group-hover:border-primary/40 transition-colors" onClick={() => window.open(course.url, "_blank")}>
                          Przejrzyj ponownie <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                        {!course.rating && (
                          <Button variant="ghost" size="sm" className="gap-1 text-xs text-ch-amber" onClick={() => setRatingDialog(course)}>
                            <Star className="w-3 h-3" /> Oceń kurs
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button className="gap-2 shadow-[0_4px_20px_-4px_hsl(160_84%_44%_/_0.3)]" onClick={() => window.open(course.url, "_blank")}>
                        {course.progress > 0 ? "Kontynuuj naukę" : "Rozpocznij kurs"}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Affiliate */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 rounded-xl bg-ch-surface-2 border border-border p-6">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🔗</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1">Program afiliacyjny</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Zarabiaj <span className="text-primary font-medium">20%</span> prowizji od każdej sprzedaży przez Twój link polecający.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                  <span className="text-xs font-mono text-muted-foreground truncate">https://app-course-hub.hardbanrecordslab.online/?ref=anna-k</span>
                </div>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={copyLink}>
                  {copied ? <><Check className="w-3 h-3" /> Skopiowano!</> : <><Copy className="w-3 h-3" /> Kopiuj link</>}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={!!ratingDialog} onOpenChange={() => { setRatingDialog(null); setHoverStar(0); }}>
        <DialogContent className="max-w-xs bg-card border-border text-center">
          <DialogHeader>
            <DialogTitle>Oceń kurs</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">{ratingDialog?.title}</p>
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)}
                onClick={() => ratingDialog && rateCourse(ratingDialog.id, s)}
                className="transition-transform hover:scale-110">
                <Star className={`w-8 h-8 ${s <= hoverStar ? "text-ch-amber fill-ch-amber" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
