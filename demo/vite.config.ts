import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    // Single React copy even though @trf/ui2 is a symlinked file: dependency.
    dedupe: ["react", "react-dom", "lucide-react"],
  },
  server: {
    host: "0.0.0.0",
    port: 5180,
    strictPort: true,
  },
});
