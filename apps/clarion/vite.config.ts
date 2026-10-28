import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The widget prototype lives at /widget on this origin (so the two share a
  // telemetry feed). In dev it runs on its own server; proxy it through.
  server: {
    proxy: {
      "/widget": { target: "http://localhost:5176", ws: true },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})