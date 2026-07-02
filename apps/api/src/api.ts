import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { HealthGroup } from "./features/health/api";

export const Api = HttpApi.make("Stores4uApi")
  .add(HealthGroup)
  .annotateMerge(
    OpenApi.annotations({
      title: "Stores4U API",
      version: "0.0.1",
    }),
  );
