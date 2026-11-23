import path from "path";
import { defineConfig, loadEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
// Async config: load `lovable-tagger` only in development so `npm install --omit=dev` builds work on hosts that skip devDependencies.
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  // Hostinger/CI set VITE_* on `process.env` for the build; that does not always reach `import.meta.env` in the client
  // bundle, so we inject a compile-time constant the app reads first (see src/lib/api.ts).
  const fileEnv = loadEnv(mode, process.cwd(), ["VITE_"]);
  const apiFromBuildEnv = mode === "production"
    ? (process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || "")
    : [
        process.env.VITE_API_BASE_URL,
        process.env.VITE_API_URL,
        fileEnv.VITE_API_BASE_URL,
        fileEnv.VITE_API_URL,
      ].find((v) => v?.trim())?.trim() ?? "";

  const plugins = [react()];
  if (mode === "development") {
    const { componentTagger } = await import("lovable-tagger");
    plugins.push(componentTagger());
  }
  return {
    define: {
      __SNOW_BITES_API_FROM_BUILD: JSON.stringify(apiFromBuildEnv),
    },
    server: {
      host: "::",
      port: 8080,
      allowedHosts: ["localhost", "127.0.0.1", "stained-ajar-jackpot.ngrok-free.dev"],
      hmr: {
        overlay: false,
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
