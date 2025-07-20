// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  assetsInclude: ["**/*.png", "**/*.mp3"],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin"
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: function(file) {
          return file.name?.endsWith(".mp3") ? `assets/[name].[ext]` : `assets/[name]-[hash].[ext]`;
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBhc3NldHNJbmNsdWRlOiBbXCIqKi8qLnBuZ1wiLCBcIioqLyoubXAzXCJdLFxuICBzZXJ2ZXI6IHtcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ3Jvc3MtT3JpZ2luLU9wZW5lci1Qb2xpY3knOiAnc2FtZS1vcmlnaW4nLFxuICAgICAgJ0Nyb3NzLU9yaWdpbi1FbWJlZGRlci1Qb2xpY3knOiAncmVxdWlyZS1jb3JwJyxcbiAgICAgICdDcm9zcy1PcmlnaW4tUmVzb3VyY2UtUG9saWN5JzogJ2Nyb3NzLW9yaWdpbidcbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgIHJldHVybiBmaWxlLm5hbWU/LmVuZHNXaXRoKFwiLm1wM1wiKVxuICAgICAgICAgICAgPyBgYXNzZXRzL1tuYW1lXS5bZXh0XWBcbiAgICAgICAgICAgIDogYGFzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdYDtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsZUFBZSxDQUFDLFlBQVksVUFBVTtBQUFBLEVBQ3RDLFFBQVE7QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLDhCQUE4QjtBQUFBLE1BQzlCLGdDQUFnQztBQUFBLE1BQ2hDLGdDQUFnQztBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCLFNBQVUsTUFBTTtBQUM5QixpQkFBTyxLQUFLLE1BQU0sU0FBUyxNQUFNLElBQzdCLHdCQUNBO0FBQUEsUUFDTjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
