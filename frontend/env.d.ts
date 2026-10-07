/// <reference types="vite/client" />

declare const __BUILD__: string;

interface ImportMetaEnv {
  VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
