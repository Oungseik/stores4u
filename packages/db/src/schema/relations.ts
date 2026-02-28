import { defineRelations } from "drizzle-orm";
import { shop } from "./shop";

export const relations = defineRelations({ shop }, () => ({}));
