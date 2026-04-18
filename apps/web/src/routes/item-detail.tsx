import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { ItemDetail } from "../pages/ItemDetail";

export const itemDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/items/$id",
	component: ItemDetail,
});
