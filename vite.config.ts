import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const workerUrl = process.env.VITE_PUTER_WORKER_URL || "https://architecture-visualizer.puter.work";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      "/api": {
        target: workerUrl,
        changeOrigin: true,
      },
    },
  },
});
