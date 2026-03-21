# 🛡️ HRL Course Hub

Centralny HUB ekosystemu **HardbanRecords Lab** do zarządzania dostępem do zewnętrznych kursów, webooków i platform edukacyjnych.

## 🚀 O projekcie

HRL Course Hub to zaawansowany manager dashboard, który łączy się z instalacjami WordPress (przez REST API i Paid Memberships Pro), umożliwiając centralne zarządzanie uprawnieniami uczniów, generowanie tokenów JWT oraz monitorowanie aktywności na wielu platformach jednocześnie.

### Kluczowe funkcje:
- **Centralny Dashboard**: Przegląd statystyk z całego ekosystemu HRL.
- **Integracja WordPress**: Bezpośrednie połączenie z WP REST API.
- **Zarządzanie Użytkownikami**: Podgląd historii dostępów i poziomów członkostwa PMPro.
- **System Tokenów JWT**: Bezpieczne autoryzowanie dostępu do zewnętrznych domen (np. Vercel).
- **Automatyzacje**: Integracje z MailerLite, Brevo, Slack, Telegram i n8n.
- **Portal Ucznia**: Przejrzysty widok posiadanych kursów dla użytkowników końcowych.

## 🛠️ Technologia

- **Frontend**: React 18, Vite, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Ikony**: Lucide React
- **Backend (Bridge)**: Python (FastAPI) w folderze `/backend`
- **Deployment**: Gotowy do wdrożenia na Vercel (`vercel.json`)

## 📦 Instalacja i uruchomienie

1. Sklonuj repozytorium
2. Zainstaluj zależności:
   ```bash
   npm install
   ```
3. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```

## 🌐 Deployment na Vercel

Projekt zawiera plik `vercel.json` skonfigurowany pod architekturę SPA oraz proxy dla API. Pamiętaj o ustawieniu zmiennych środowiskowych w panelu Vercel, jeśli Twoja konfiguracja WordPress tego wymaga.

---
© 2026 **HardbanRecords Lab** · Wszystkie prawa zastrzeżone.
