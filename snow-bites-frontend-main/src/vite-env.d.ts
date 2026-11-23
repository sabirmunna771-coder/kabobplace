/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public API base, e.g. https://api.example.com (path /api is added in code if omitted) */
  readonly VITE_API_URL?: string;
  /** Same as VITE_API_URL; some hosts (e.g. Hostinger) use this name. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Set in index.html for live API without rebuilding. E.g. "https://api.example.com" */
  __SNOW_BITES_API_URL__?: string;
}

/** Injected in vite.config.ts from process.env + .env (Hostinger / CI `npm run build`). */
declare const __SNOW_BITES_API_FROM_BUILD: string;
