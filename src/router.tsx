import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Matches vite's `base` (see vite.config.ts) — "/" normally, or "/<repo>/"
    // for a GitHub Pages project page built with VITE_BASE_PATH set.
    basepath: import.meta.env.BASE_URL,
  });

  return router;
};
