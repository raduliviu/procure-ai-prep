import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { NewItem } from "../pages/NewItem";

export const newItemRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/items/new",
	component: NewItem,
});
