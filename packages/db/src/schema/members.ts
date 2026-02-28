import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const employee = sqliteTable(
  "employee",
  {
    id: text("id").primaryKey().$defaultFn(Bun.randomUUIDv7),
    employeeCode: text("employee_code").notNull().unique(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone").notNull(),
    address: text("address"),
    dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
    gender: text("gender", { enum: ["MALE", "FEMALE"] }),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    position: text("position").notNull(),
    hireDate: integer("hire_date", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    salary: integer("salary").notNull(),
    terminationDate: integer("termination_date", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("employee_name_idx").on(t.name)],
);

export type EmployeeSelect = typeof employee.$inferSelect;
export type EmployeeInsert = typeof employee.$inferInsert;
