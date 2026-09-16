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

// Detect once and memoize: the tgWebApp* launch data lives in the URL
// fragment, which vue-router drops on the first router.push — a later
// re-check (e.g. on /game/:id) would falsely report "not Telegram".
let tgDetected: boolean | null = null;
let tgVia = '';

export function isTelegram(): boolean {
  if (tgDetected === null) {
    tgDetected = detectTelegram();
  }
  return tgDetected;
}

// How Telegram was detected: 'url' (launch data in URL), 'sdk' (WebApp object
// already present) or 'ua' (user-agent only — weakest signal).
export function tgDetectedVia(): string {
  return tgVia;
}

function detectTelegram(): boolean {
  if (typeof window === 'undefined') return false;
  // Clients differ in how they pass launch data: in the URL hash, in the query
  // string, or only through the injected SDK object — check all of them.
  if (window.location.hash.includes('tgWebApp') || window.location.search.includes('tgWebApp')) {
    tgVia = 'url';
    return true;
  }
  if (window.Telegram?.WebApp) {
    tgVia = 'sdk';
    return true;
  }
  if (/Telegram/i.test(navigator.userAgent)) {
    tgVia = 'ua';
    return true;
  }
  return false;
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
