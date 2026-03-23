CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "cached_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" text NOT NULL,
	"folder_id" text NOT NULL,
	"thread_id" text,
	"subject" text,
	"from_address" text,
	"to_address" text,
	"cc_address" text,
	"snippet" text,
	"received_at" timestamp,
	"is_read" boolean DEFAULT false,
	"is_flagged" boolean DEFAULT false,
	"has_attachment" boolean DEFAULT false,
	"size" integer,
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cached_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"folder_id" text NOT NULL,
	"folder_name" text NOT NULL,
	"message_count" integer DEFAULT 0,
	"unread_count" integer DEFAULT 0,
	"folder_type" text NOT NULL,
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_cache_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"folder_id" text NOT NULL,
	"last_sync_at" timestamp,
	"oldest_message_date" timestamp,
	"total_cached" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	"zoho_account_id" text,
	"zoho_region" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cached_emails" ADD CONSTRAINT "cached_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cached_folders" ADD CONSTRAINT "cached_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_cache_metadata" ADD CONSTRAINT "email_cache_metadata_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_message_idx" ON "cached_emails" USING btree ("user_id","message_id");--> statement-breakpoint
CREATE INDEX "user_folder_date_idx" ON "cached_emails" USING btree ("user_id","folder_id","received_at");--> statement-breakpoint
CREATE INDEX "user_thread_idx" ON "cached_emails" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_folder_idx" ON "cached_folders" USING btree ("user_id","folder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_folder_meta_idx" ON "email_cache_metadata" USING btree ("user_id","folder_id");