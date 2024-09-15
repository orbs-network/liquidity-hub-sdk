import { defineConfig } from 'vite'
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3003,
  },
  define: {
    "process.env": process.env,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      fileName: (format) => `main.${format}.js`,
      name: "main",
    },
    rollupOptions: {
      input: path.resolve(__dirname, "src/lib/index.ts"),
    },

  },

  plugins: [
    svgr(),
    tsconfigPaths(),
    dts({
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src/lib/**/*.*"],
    }),
  ],
});
