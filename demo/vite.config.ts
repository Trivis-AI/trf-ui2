import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import pkg from "../package.json";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // Surface the @trf/ui2 version (tracks the cut tag) to the sink header.
  define: {
    __UI2_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    // Single copy of these even though @trf/ui2 is a symlinked file: dependency
    // — the demo and @trf/ui2 each have their own node_modules. recharts MUST
    // be deduped too: ChartContainer's ResponsiveContainer (from @trf/ui2's
    // recharts) and the demo's <AreaChart> (from the demo's recharts) have to
    // be the *same* module instance or recharts' internal context doesn't match
    // and the chart renders an empty 0×0 container. (Real consumers like
    // trffrontai dedupe to one recharts automatically, so this is demo-only.)
    dedupe: ["react", "react-dom", "lucide-react", "recharts"],
  },
  server: {
    host: "0.0.0.0",
    port: 5180,
    strictPort: true,
  },
});
