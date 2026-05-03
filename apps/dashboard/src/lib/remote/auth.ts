import { error } from "@sveltejs/kit";
import type { Session, User } from "better-auth";

type AuthLocals = { session: Session; user: User };

export function assertAuth(locals: App.Locals): asserts locals is AuthLocals & App.Locals {
  if (!locals.session) {
    error(401, "Unauthorized");
  }
}
