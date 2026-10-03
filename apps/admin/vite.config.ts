import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import branding from "../../packages/contracts/src/branding.json" with { type: "json" };

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // Fills %DISPLAY_NAME% / %ADMIN_TITLE% in index.html from the shared branding.json.
      name: "branding-html",
      transformIndexHtml: (html) =>
        html
          .replaceAll("%DISPLAY_NAME%", branding.displayName)
          .replaceAll("%ADMIN_TITLE%", branding.adminTitle),
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
