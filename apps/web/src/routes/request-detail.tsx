import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { RequestDetail } from "../pages/RequestDetail";

export const requestDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/requests/$id",
  component: RequestDetail,
});
