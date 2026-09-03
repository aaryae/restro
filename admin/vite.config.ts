import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

type EnvironmentVariables = Record<string, string>;

interface ServerConfig {
  open: boolean;
  port: number | undefined;
  host: string;
}

interface AliasConfig {
  [key: string]: string;
}

export default function config(mode: string) {
  const env: EnvironmentVariables = loadEnv(mode, process.cwd(), "");
  return defineConfig({
    base: "/",
    build: {
      manifest: true,
      assetsDir: "assets",
      outDir: "dist",
      target: "es2020",
      cssCodeSplit: true,
      minify: "esbuild",
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-dom")) return "vendor-react-dom";
              if (id.includes("react") && !id.includes("lucide-react"))
                return "vendor-react";
              if (id.includes("@reduxjs") || id.includes("react-redux") || id.includes("redux-persist"))
                return "vendor-redux";
              if (id.includes("recharts") || id.includes("d3-"))
                return "vendor-charts";
              if (id.includes("lucide-react")) return "vendor-icons";
              if (id.includes("html2canvas")) return "vendor-html2canvas";
              if (id.includes("jspdf")) return "vendor-jspdf";
              if (id.includes("xlsx")) return "vendor-xlsx";
              if (
                id.includes("date-fns") ||
                id.includes("react-date") ||
                id.includes("react-day-picker")
              )
                return "vendor-dates";
              if (id.includes("@radix-ui") || id.includes("react-aria"))
                return "vendor-ui";
              if (id.includes("@dnd-kit")) return "vendor-dnd";
              if (id.includes("zod") || id.includes("react-hook-form") || id.includes("@hookform"))
                return "vendor-forms";
            }
          },
        },
      },
    },
    plugins: [react()],
    server: {
      open: false,
      port: Number(env.VITE_PORT || 7001),
      strictPort: true,
      host: "0.0.0.0",
    } as ServerConfig,
    resolve: {
      alias: {
        "@/components": path.resolve("src/components"),
        "@/assets": path.resolve("src/assets"),
        "@/pages": path.resolve("src/pages"),
        "@/utils": path.resolve("src/utils"),
        "@/redux": path.resolve("src/redux"),
        "@/hooks": path.resolve("src/hooks"),
        "@/constants": path.resolve("src/constants"),
        "@/locale": path.resolve("src/locale"),
        "@/onboarding": path.resolve("src/onboarding"),
        "@/routes": path.resolve("src/routes"),
        "@/lib": path.resolve("src/lib"),
      } as AliasConfig,
    },
  });
}
