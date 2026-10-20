import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Three pages share one bundle: the start page and one dashboard per country. The country a page
// shows is set on its #root element (data-country), so adding a country is a new HTML file, an
// entry in src/countries.js and its data in ../data/<country>/.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    minify: "terser",
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true, passes: 3 },
      mangle: { toplevel: true },
      format: { comments: false },
    },
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        austria: resolve(import.meta.dirname, "austria/index.html"),
        netherlands: resolve(import.meta.dirname, "netherlands/index.html"),
      },
      output: { manualChunks: { react: ["react", "react-dom"] } },
    },
  },
});
