import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { Queue } from "../pages/Queue";

export const queueRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: Queue,
});
