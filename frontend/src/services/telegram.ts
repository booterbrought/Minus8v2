// Telegram Mini App integration. Only active when the app is launched from a
// Telegram client, which appends tgWebApp* fields to the URL hash. In a normal
// browser none of this runs — the SDK script is never even loaded.

const TWA_SCRIPT_URL = 'https://telegram.org/js/telegram-web-app.js';

interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    start_param?: string;
    user?: TelegramWebAppUser;
  };
  ready(): void;
  expand(): void;
  openTelegramLink(url: string): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function isTelegram(): boolean {
  return typeof window !== 'undefined' && window.location.hash.includes('tgWebApp');
}

let webAppPromise: Promise<TelegramWebApp | null> | null = null;

export function getWebApp(): Promise<TelegramWebApp | null> {
  if (!isTelegram()) return Promise.resolve(null);
  if (!webAppPromise) {
    webAppPromise = new Promise((resolve) => {
      if (window.Telegram?.WebApp) {
        resolve(window.Telegram.WebApp);
        return;
      }
      const script = document.createElement('script');
      script.src = TWA_SCRIPT_URL;
      script.onload = () => resolve(window.Telegram?.WebApp ?? null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  return webAppPromise;
}
