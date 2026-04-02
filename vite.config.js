import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import { defineConfig } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Inline PostCSS so Tailwind always runs (fixes Windows / spaced paths where
// postcss.config discovery can fail and leaves @tailwind rules unprocessed).
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, "tailwind.config.js") }),
        autoprefixer(),
      ],
    },
  },
})
