import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { NewRequest } from "../pages/NewRequest";

export const newRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests/new",
  component: NewRequest,
});
