import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/root";
import { homeRoute } from "./routes/home";
import { newItemRoute } from "./routes/new-item";
import { itemDetailRoute } from "./routes/item-detail";

const routeTree = rootRoute.addChildren([homeRoute, newItemRoute, itemDetailRoute]);

export const router = createRouter({ routeTree });

// Register the router instance for type safety — this makes every
// <Link>, useNavigate, useParams, useSearch etc. strongly typed
// against our route tree.
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
