import { resolve } from "node:path";
import { defineConfig } from "vite";

function rewriteAppRoute(url: string | undefined): string | undefined {
  if (!url) return url;
  const queryIndex = url.indexOf("?");
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : url.slice(queryIndex);
  if (pathname === "/admin" || pathname === "/auth") {
    return `${pathname}/index.html${query}`;
  }
  return url;
}

export default defineConfig({
  plugins: [{
    name: "clean-app-routes",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        req.url = rewriteAppRoute(req.url);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        req.url = rewriteAppRoute(req.url);
        next();
      });
    },
  }],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        auth: resolve(__dirname, "auth/index.html"),
        admin: resolve(__dirname, "admin/index.html"),
      },
    },
  },
});
