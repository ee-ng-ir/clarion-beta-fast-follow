import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
// Served under the Clarion app at /widget so the two share an origin (and so a
// shared telemetry feed). Clarion's build copies this app's dist into dist/widget.
export default defineConfig({
  base: "/widget/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})