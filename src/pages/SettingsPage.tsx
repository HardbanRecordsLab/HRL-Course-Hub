import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, Link, Mail, Database, ChevronRight, Save, Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { integrations } from "@/lib/mockData";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import IntegrationConfigPanel, { configs } from "@/components/IntegrationConfigPanel";
import { useToast } from "@/hooks/use-toast";
import { getWpConfig, saveWpConfig, clearWpConfig } from "@/lib/wpConfig";
import { testConnection } from "@/lib/wpApi";

const tabs = [
  { id: "wordpress", label: "WordPress", icon: Globe },
  { id: "general", label: "Ogólne", icon: Settings },
  { id: "pmpro", label: "PMPro Bridge", icon: Link },
  { id: "security", label: "Bezpieczeństwo", icon: Shield },
  { id: "integrations", label: "Integracje", icon: Database },
  { id: "email", label: "Email", icon: Mail },
];

const integrationIdMap: Record<string, string> = {
  "MailerLite": "mailerlite",
  "Brevo SMTP": "brevo",
  "Slack": "slack",
  "Telegram Bot": "telegram",
  "Google Sheets": "google_sheets",
  "n8n / Make.com": "n8n",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("wordpress");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [integrationStates, setIntegrationStates] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(i => [i.name, i.enabled]))
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // WordPress config state
  const existingWpConfig = getWpConfig();
  const [wpUrl, setWpUrl] = useState(existingWpConfig?.siteUrl || "");
  const [wpAppPassword, setWpAppPassword] = useState(existingWpConfig?.applicationPassword || "");
  const [wpJwtSecret, setWpJwtSecret] = useState(existingWpConfig?.jwtSecret || "");
  const [wpTesting, setWpTesting] = useState(false);
  const [wpTestResult, setWpTestResult] = useState<{ ok: boolean; name?: string; error?: string } | null>(null);

  const handleSaveWp = () => {
    if (!wpUrl) {
      toast({ title: "Błąd", description: "URL WordPress jest wymagany", variant: "destructive" });
      return;
    }
    saveWpConfig({ siteUrl: wpUrl, applicationPassword: wpAppPassword, jwtSecret: wpJwtSecret });
    toast({ title: "Zapisano", description: "Konfiguracja WordPress została zapisana" });
  };

  const handleTestWp = async () => {
    if (!wpUrl) {
      toast({ title: "Błąd", description: "Najpierw podaj URL WordPress", variant: "destructive" });
      return;
    }
    // Save first so testConnection can read it
    saveWpConfig({ siteUrl: wpUrl, applicationPassword: wpAppPassword, jwtSecret: wpJwtSecret });
    setWpTesting(true);
    setWpTestResult(null);
    try {
      const info = await testConnection();
      setWpTestResult({ ok: true, name: info.name });
    } catch (err: any) {
      setWpTestResult({ ok: false, error: err.message });
    } finally {
      setWpTesting(false);
    }
  };

  const handleDisconnectWp = () => {
    clearWpConfig();
    setWpUrl("");
    setWpAppPassword("");
    setWpJwtSecret("");
    setWpTestResult(null);
    toast({ title: "Rozłączono", description: "Konfiguracja WordPress została usunięta" });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Zapisano", description: "Ustawienia zostały zaktualizowane" });
    }, 800);
  };

  const toggleIntegration = (name: string) => {
    setIntegrationStates(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-sm text-muted-foreground mt-1">Konfiguracja CourseHub Manager</p>
      </div>

      {!selectedIntegration && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-ch-surface-2 hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedIntegration ? (
          <IntegrationConfigPanel key={selectedIntegration} integrationId={selectedIntegration} onBack={() => setSelectedIntegration(null)} />
        ) : (
          <>
            {activeTab === "wordpress" && (
              <motion.div key="wordpress" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-card border border-border p-6 space-y-5">
                <div>
                  <h3 className="text-base font-semibold mb-1">Połączenie z WordPress</h3>
                  <p className="text-xs text-muted-foreground">Podaj adres WP i dane do REST API. CourseHub będzie pobierał użytkowników, kursy i PMPro levels bezpośrednio z Twojej instalacji WordPress.</p>
                </div>

                {wpTestResult && (
                  <div className={`flex items-center gap-3 p-4 rounded-lg border ${wpTestResult.ok ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
                    {wpTestResult.ok ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <XCircle className="w-5 h-5 text-destructive" />}
                    <div>
                      <p className={`text-sm font-medium ${wpTestResult.ok ? "text-primary" : "text-destructive"}`}>
                        {wpTestResult.ok ? `Połączono: ${wpTestResult.name}` : "Błąd połączenia"}
                      </p>
                      {wpTestResult.error && <p className="text-[11px] text-muted-foreground mt-0.5">{wpTestResult.error}</p>}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block">URL WordPress</label>
                  <input value={wpUrl} onChange={e => setWpUrl(e.target.value)}
                    placeholder="https://twojadomena.pl"
                    className="w-full max-w-lg px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  <p className="text-[11px] text-muted-foreground mt-1">Adres Twojej strony WordPress (bez /wp-json)</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Application Password (Base64)</label>
                  <input value={wpAppPassword} onChange={e => setWpAppPassword(e.target.value)} type="password"
                    placeholder="dXNlcjpwYXNzd29yZA=="
                    className="w-full max-w-lg px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  <p className="text-[11px] text-muted-foreground mt-1">WP → Users → Application Passwords. Zakoduj "user:hasło" w Base64.</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">JWT Secret (opcjonalnie)</label>
                  <input value={wpJwtSecret} onChange={e => setWpJwtSecret(e.target.value)} type="password"
                    placeholder="your-jwt-secret-key"
                    className="w-full max-w-lg px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  <p className="text-[11px] text-muted-foreground mt-1">Secret key z pluginu JWT Auth na WP (do logowania uczniów przez JWT)</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSaveWp} className="gap-2">
                    <Save className="w-4 h-4" /> Zapisz konfigurację
                  </Button>
                  <Button onClick={handleTestWp} variant="outline" className="gap-2" disabled={wpTesting}>
                    {wpTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    {wpTesting ? "Testowanie..." : "Test połączenia"}
                  </Button>
                  {existingWpConfig && (
                    <Button onClick={handleDisconnectWp} variant="ghost" className="text-destructive hover:text-destructive gap-2">
                      <XCircle className="w-4 h-4" /> Rozłącz
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === "integrations" && (
              <motion.div key="integrations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {integrations.map((integ) => {
                  const configId = integrationIdMap[integ.name];
                  const hasConfig = configId && configs[configId];
                  const isEnabled = integrationStates[integ.name] ?? integ.enabled;
                  return (
                    <div key={integ.name} onClick={() => hasConfig && setSelectedIntegration(configId)}
                      className={`flex items-center justify-between px-5 py-4 rounded-xl bg-card border border-border transition-colors ${hasConfig ? "hover:border-primary/30 cursor-pointer" : ""}`}>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{integ.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{integ.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {isEnabled ? "Połączony i aktywny" : "Kliknij aby skonfigurować"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEnabled && <span className="text-[11px] text-primary font-mono">connected</span>}
                        <Switch checked={isEnabled} onCheckedChange={() => toggleIntegration(integ.name)} onClick={(e) => e.stopPropagation()} />
                        {hasConfig && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "general" && (
              <motion.div key="general" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-card border border-border p-6 space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nazwa platformy</label>
                  <input defaultValue="Moja Platforma Kursów" className="w-full max-w-md px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Strona portalu ucznia</label>
                  <input defaultValue="/moje-kursy/" className="w-full max-w-md px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Domyślny czas wygaśnięcia tokenu</label>
                  <div className="flex gap-2 max-w-xs">
                    <input defaultValue="24" type="number" className="w-20 px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                    <select className="px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option>godzin</option>
                      <option>minut</option>
                      <option>dni</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="text-sm font-medium">Tryb debugowania</p>
                    <p className="text-[11px] text-muted-foreground">Loguj szczegóły tokenów i REST API</p>
                  </div>
                  <Switch />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 mt-4">
                  <Save className="w-4 h-4" /> {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
                </Button>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-card border border-border p-6 space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Globalny Secret Key (fallback JWT)</label>
                  <div className="flex gap-2 max-w-lg">
                    <input defaultValue="sk_ch_a8f3e2b1c9d4..." type="password" className="flex-1 px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                    <Button variant="outline" onClick={() => toast({ title: "Klucz zregenerowany", description: "Nowy globalny secret key został wygenerowany" })}>Regeneruj</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Rate limit REST API</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input defaultValue="60" type="number" className="w-20 px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                    <span className="text-sm text-muted-foreground">req/min per IP</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Retencja logów</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input defaultValue="90" type="number" className="w-20 px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                    <span className="text-sm text-muted-foreground">dni</span>
                  </div>
                </div>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="text-sm font-medium">Wymuszaj HTTPS</p>
                    <p className="text-[11px] text-muted-foreground">Blokuj nieszyfrowane połączenia REST API</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 mt-4">
                  <Save className="w-4 h-4" /> {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
                </Button>
              </motion.div>
            )}

            {activeTab === "pmpro" && (
              <motion.div key="pmpro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-card border border-border p-6 space-y-5">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary pulse-dot" />
                  <div>
                    <p className="text-sm font-medium text-primary">Paid Memberships Pro wykryty</p>
                    <p className="text-[11px] text-muted-foreground">Wersja 3.4.2 · 4 aktywne poziomy · 448 członków</p>
                  </div>
                </div>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="text-sm font-medium">Auto-przyznaj dostęp</p>
                    <p className="text-[11px] text-muted-foreground">Przy zmianie Membership Level</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="text-sm font-medium">Auto-odbierz dostęp</p>
                    <p className="text-[11px] text-muted-foreground">Przy anulowaniu/wygaśnięciu</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 mt-4">
                  <Save className="w-4 h-4" /> {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
                </Button>
              </motion.div>
            )}

            {activeTab === "email" && (
              <motion.div key="email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-card border border-border p-6 space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Dostawca</label>
                  <select className="px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary max-w-xs w-full">
                    <option>Brevo SMTP</option>
                    <option>wp_mail (domyślny)</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">From Name</label>
                    <input defaultValue="Moja Platforma" className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">From Email</label>
                    <input defaultValue="kursy@twojadomena.pl" className="w-full px-4 py-2.5 rounded-lg bg-ch-surface-2 border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 mt-4">
                  <Save className="w-4 h-4" /> {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
                </Button>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
