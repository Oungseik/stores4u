import { defineRelations } from "drizzle-orm";
import { users } from "./user";

// ponytail: users is the only exploration table and has no FKs yet, so its
// relation set is empty. Add one/many entries here when new tables land.
export const relations = defineRelations({ users }, (_r) => ({
  users: {},
}));
