import { defineRelations } from "drizzle-orm";
import { employee } from "./members";

export const relations = defineRelations({ employee }, () => ({ employee: {} }));
