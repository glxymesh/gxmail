import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core"

// ─── NextAuth Tables ─────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  zohoAccountId: text("zoho_account_id"),
  zohoRegion: text("zoho_region"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("provider_account_idx").on(
      table.provider,
      table.providerAccountId
    ),
  ]
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
  ]
)

// ─── Email Cache Tables ──────────────────────────────────────────

export const cachedFolders = pgTable(
  "cached_folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    folderId: text("folder_id").notNull(),
    folderName: text("folder_name").notNull(),
    messageCount: integer("message_count").default(0),
    unreadCount: integer("unread_count").default(0),
    folderType: text("folder_type").notNull(), // "Inbox", "Sent", "Drafts", "Trash", "Spam", "custom"
    syncedAt: timestamp("synced_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("user_folder_idx").on(table.userId, table.folderId),
  ]
)

export const cachedEmails = pgTable(
  "cached_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageId: text("message_id").notNull(),
    folderId: text("folder_id").notNull(),
    threadId: text("thread_id"),
    subject: text("subject"),
    fromAddress: text("from_address"), // JSON string: {address, name}
    toAddress: text("to_address"), // JSON string: [{address, name}]
    ccAddress: text("cc_address"), // JSON string
    snippet: text("snippet"),
    receivedAt: timestamp("received_at", { mode: "date" }),
    isRead: boolean("is_read").default(false),
    isFlagged: boolean("is_flagged").default(false),
    hasAttachment: boolean("has_attachment").default(false),
    size: integer("size"),
    syncedAt: timestamp("synced_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("user_message_idx").on(table.userId, table.messageId),
    index("user_folder_date_idx").on(
      table.userId,
      table.folderId,
      table.receivedAt
    ),
    index("user_thread_idx").on(table.userId, table.threadId),
  ]
)

export const emailCacheMetadata = pgTable(
  "email_cache_metadata",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    folderId: text("folder_id").notNull(),
    lastSyncAt: timestamp("last_sync_at", { mode: "date" }),
    oldestMessageDate: timestamp("oldest_message_date", { mode: "date" }),
    totalCached: integer("total_cached").default(0),
  },
  (table) => [
    uniqueIndex("user_folder_meta_idx").on(table.userId, table.folderId),
  ]
)
