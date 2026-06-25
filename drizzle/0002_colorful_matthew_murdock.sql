ALTER TABLE "account" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "timezone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "week_starts_on" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "rollover_enabled" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "last_rollover_date" SET DATA TYPE text;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");