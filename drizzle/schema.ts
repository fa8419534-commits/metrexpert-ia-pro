import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const generationWindows = mysqlTable("generation_windows", {
  id: int("id").autoincrement().primaryKey(),
  scopeKey: varchar("scopeKey", { length: 255 }).notNull().unique(),
  windowKind: mysqlEnum("windowKind", ["hour", "day"]).notNull(),
  windowStart: timestamp("windowStart").notNull(),
  count: int("count").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GenerationWindow = typeof generationWindows.$inferSelect;

export const clientAccessCodes = mysqlTable("client_access_codes", {
  id: int("id").autoincrement().primaryKey(),
  codeHash: varchar("codeHash", { length: 64 }).notNull().unique(),
  clientName: varchar("clientName", { length: 160 }).notNull(),
  monthlyQuota: int("monthlyQuota").notNull(),
  monthlyUsed: int("monthlyUsed").default(0).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 32 }),
  paymentReference: varchar("paymentReference", { length: 120 }),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  disabledAt: timestamp("disabledAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientAccessCode = typeof clientAccessCodes.$inferSelect;
export type InsertClientAccessCode = typeof clientAccessCodes.$inferInsert;

export const paymentRequests = mysqlTable("payment_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestKey: varchar("requestKey", { length: 64 }).notNull().unique(),
  clientName: varchar("clientName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }),
  planQuota: int("planQuota").notNull(),
  amountXof: int("amountXof").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["wave", "moov", "mtn", "autre"]).notNull(),
  paymentReference: varchar("paymentReference", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
  accessCodeId: int("accessCodeId"),
  adminNote: varchar("adminNote", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = typeof paymentRequests.$inferInsert;

export const freeTrialContacts = mysqlTable("free_trial_contacts", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 160 }),
  phone: varchar("phone", { length: 32 }),
  phoneHash: varchar("phoneHash", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }),
  emailHash: varchar("emailHash", { length: 64 }).unique(),
  trialAt: timestamp("trialAt").defaultNow().notNull(),
  convertedAt: timestamp("convertedAt"),
  lastWhatsAppContactAt: timestamp("lastWhatsAppContactAt"),
  consentedAt: timestamp("consentedAt"),
  unsubscribedAt: timestamp("unsubscribedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FreeTrialContact = typeof freeTrialContacts.$inferSelect;
export type InsertFreeTrialContact = typeof freeTrialContacts.$inferInsert;

// TODO: Add your tables here