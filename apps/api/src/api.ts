import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { AuthGroup } from "./features/auth/api";
import { HealthGroup } from "./features/health/api";

export const Api = HttpApi.make("Stores4uApi")
  .add(HealthGroup)
  .add(AuthGroup)
  .annotateMerge(
    OpenApi.annotations({
      title: "Stores4U API",
      version: "0.0.1",
    }),
  );
