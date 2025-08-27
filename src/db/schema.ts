// src/db/schema.ts
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// ================================
// ENUMS
// ================================

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "superadmin",
]);

// ================================
// TABELAS
// ================================

export const usersTables = pgTable("users_tables", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").default("FREE").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { mode: "date" }),

  // Configurações do usuário
  timezone: text("timezone").default("America/Sao_Paulo").notNull(),
  dailyMessageLimit: integer("daily_message_limit").default(1000).notNull(),
  monthlyMessageLimit: integer("monthly_message_limit")
    .default(10000)
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // limite de instâncias
  instanceLimits: integer("instance_limits").default(2).notNull(),
  instanceTotal: integer("instance_total").default(0).notNull(),

  // Configurações avançadas
  settings: jsonb("settings").default({}).notNull(),

  // Auditoria
  lastLoginAt: timestamp("last_login_at"),
  deletedAt: timestamp("deleted_at"),
});

export const instancesTables = pgTable(
  "instances_tables",
  {
    instanceId: text("instance_id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTables.id, { onDelete: "cascade" }),
    instanceName: text("instance_name").notNull(),
    integration: text("integration").notNull().default("WHATSAPP-BAILEYS"),
    status: text("status").default("disconnected").notNull(),
    ownerJid: text("owner_jid"),
    profileName: text("profile_name"),
    profilePicUrl: text("profile_pic_url"),
    qrcode: boolean("qrcode").default(true).notNull(),
    phoneNumber: text("phone_number"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),

    // Estatísticas da instância (Calculadas ou atualizadas por triggers/workers)
    totalMessagesSent: integer("total_messages_sent").default(0).notNull(),
    typeMessagesSent: jsonb("type_messages_sent").default({}).notNull(),
    monthlyMessagesSent: integer("monthly_messages_sent").default(0).notNull(),
    lastMessageSentAt: timestamp("last_message_sent_at"),
    lastResetAt: timestamp("last_reset_at")
      .$defaultFn(() => new Date())
      .notNull(),

    // Status de conexão
    isConnected: boolean("is_connected").default(false).notNull(),
    lastConnectedAt: timestamp("last_connected_at"),
    disconnectedAt: timestamp("disconnected_at"),

    // Configurações da instância
    webhookUrl: text("webhook_url"),
    webhookEnabled: boolean("webhook_enabled").default(false).notNull(),

    // Auditoria
    deletedAt: timestamp("deleted_at"), // Soft delete
  },
  (instances) => ({
    userIdIdx: index("instances_user_id_idx").on(instances.userId),
    statusIdx: index("instances_status_idx").on(instances.status),
    activeIdx: index("instances_active_idx").on(instances.isActive),
    phoneIdx: index("instances_phone_idx").on(instances.phoneNumber),
    deletedIdx: index("instances_deleted_idx").on(instances.deletedAt),
  }),
);

export const proxiesTables = pgTable(
  "proxies_tables",
  {
    id: text("id").primaryKey().notNull(),
    host: text("host").notNull(),
    port: text("port").notNull(),
    username: text("username"),
    password: text("password"),
    protocol: text("protocol").default("socks5").notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    assignedInstanceName: text("assigned_instance_name"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (proxies) => ({
    hostIdx: index("proxies_host_idx").on(proxies.host),
    usedIdx: index("proxies_used_idx").on(proxies.isUsed),
    instanceIdx: index("proxies_instance_idx").on(proxies.assignedInstanceName),
    activeIdx: index("proxies_active_idx").on(proxies.isActive),
  }),
);

export const sessionsTables = pgTable("sessions_tables", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTables.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by").references(() => usersTables.id, {
    onDelete: "set null",
  }),
});

export const accountsTables = pgTable("accounts_tables", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTables.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTables = pgTable("verifications_tables", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// ================================
// RELAÇÕES
// ================================

export const usersRelations = relations(usersTables, ({ many }) => ({
  instances: many(instancesTables),
  sessions: many(sessionsTables),
  accounts: many(accountsTables),
  impersonatedSessions: many(sessionsTables, {
    relationName: "impersonatedSession",
  }),
}));

export const instancesRelations = relations(
  instancesTables,
  ({ one, many }) => ({
    user: one(usersTables, {
      fields: [instancesTables.userId],
      references: [usersTables.id],
    }),
  }),
);

export const sessionsRelations = relations(sessionsTables, ({ one }) => ({
  user: one(usersTables, {
    fields: [sessionsTables.userId],
    references: [usersTables.id],
  }),
  impersonatedByUser: one(usersTables, {
    fields: [sessionsTables.impersonatedBy],
    references: [usersTables.id],
    relationName: "impersonatedSession",
  }),
}));

export const accountsRelations = relations(accountsTables, ({ one }) => ({
  user: one(usersTables, {
    fields: [accountsTables.userId],
    references: [usersTables.id],
  }),
}));

export const proxiesRelations = relations(proxiesTables, ({ one }) => ({
  instance: one(instancesTables, {
    fields: [proxiesTables.assignedInstanceName],
    references: [instancesTables.instanceName],
  }),
}));

// ================================
// SCHEMAS DE VALIDAÇÃO ZOD
// ================================

export const CreateInstanceSchema = z.object({
  instanceName: z.string().min(1, "Nome da instância é obrigatório").max(50),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  webhookEnabled: z.boolean(),
});

// ================================
// TIPOS TYPESCRIPT
// ================================

export type User = typeof usersTables.$inferSelect;
export type NewUser = typeof usersTables.$inferInsert;

// Definição do tipo para o JSON de contagem de mensagens
export type MessageTypeCounts = {
  text?: number;
  audio?: number;
  sticker?: number;
  button?: number;
  list?: number;
  media?: number; // Para imagens, vídeos, documentos, etc.
};

export type Instance = Omit<
  typeof instancesTables.$inferSelect,
  "typeMessagesSent"
> & {
  typeMessagesSent: MessageTypeCounts;
};
export type NewInstance = typeof instancesTables.$inferInsert;

export type Proxy = typeof proxiesTables.$inferSelect;
export type NewProxy = typeof proxiesTables.$inferInsert;
