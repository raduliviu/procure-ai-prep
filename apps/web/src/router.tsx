import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/root";
import { queueRoute } from "./routes/queue";
import { newRequestRoute } from "./routes/new-request";
import { requestDetailRoute } from "./routes/request-detail";

const routeTree = rootRoute.addChildren([
  queueRoute,
  newRequestRoute,
  requestDetailRoute,
]);

export const router = createRouter({ routeTree });

// Register the router instance for type safety — this makes every
// <Link>, useNavigate, useParams, useSearch etc. strongly typed
// against our route tree.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
