CREATE TABLE "linked_email_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" integer,
	"region" text,
	"is_default" boolean DEFAULT false,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "cached_emails" ADD COLUMN "linked_account_id" uuid;--> statement-breakpoint
ALTER TABLE "cached_folders" ADD COLUMN "linked_account_id" uuid;--> statement-breakpoint
ALTER TABLE "email_cache_metadata" ADD COLUMN "linked_account_id" uuid;--> statement-breakpoint
ALTER TABLE "linked_email_accounts" ADD CONSTRAINT "linked_email_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "linked_account_idx" ON "linked_email_accounts" USING btree ("user_id","provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "linked_account_user_idx" ON "linked_email_accounts" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "cached_emails" ADD CONSTRAINT "cached_emails_linked_account_id_linked_email_accounts_id_fk" FOREIGN KEY ("linked_account_id") REFERENCES "public"."linked_email_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cached_folders" ADD CONSTRAINT "cached_folders_linked_account_id_linked_email_accounts_id_fk" FOREIGN KEY ("linked_account_id") REFERENCES "public"."linked_email_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_cache_metadata" ADD CONSTRAINT "email_cache_metadata_linked_account_id_linked_email_accounts_id_fk" FOREIGN KEY ("linked_account_id") REFERENCES "public"."linked_email_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "zoho_account_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "zoho_region";