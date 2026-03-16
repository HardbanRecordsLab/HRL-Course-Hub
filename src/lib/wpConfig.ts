const STORAGE_KEY = "coursehub_wp_config";

export interface WpConfig {
  siteUrl: string;
  applicationPassword: string; // Base64 "user:pass"
  jwtSecret: string;
}

export function getWpConfig(): WpConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWpConfig(config: WpConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearWpConfig() {
  localStorage.removeItem(STORAGE_KEY);
}
