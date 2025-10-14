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
    },
    plugins: [react()],
    server: {
      open: false,
      port: env.VITE_PORT || 7001,
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
        "@/routes": path.resolve("src/routes"),
        "@/lib": path.resolve("src/lib"),
      } as AliasConfig,
    },
  });
}
