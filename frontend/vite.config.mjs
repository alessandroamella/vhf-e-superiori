import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    minify: "esbuild",
    target: "es2015",
    cssMinify: "lightningcss",
    outDir: "./server/dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:6961",
        changeOrigin: true,
        secure: false,
      },
    },
    port: 3000,
  },
});
