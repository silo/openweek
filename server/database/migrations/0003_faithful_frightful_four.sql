-- Accent gains blue (the new default) and graphite.
--
-- drizzle-kit generates `ALTER TYPE ... ADD VALUE` followed by a `SET DEFAULT 'blue'`, which
-- Postgres rejects inside a transaction: "unsafe use of new value 'blue' of enum type accent
-- — new enum values must be committed before they can be used". Migrations run in one
-- transaction, so this rebuilds the type instead, the same way 0001 does.
--
-- Existing rows keep their accent; only the column default moves to blue.

CREATE TYPE "public"."accent_new" AS ENUM('persimmon', 'amber', 'jade', 'indigo', 'magenta', 'blue', 'graphite');--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" SET DATA TYPE "public"."accent_new"
  USING ("accent_color"::text)::"public"."accent_new";--> statement-breakpoint
DROP TYPE "public"."accent";--> statement-breakpoint
ALTER TYPE "public"."accent_new" RENAME TO "accent";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" SET DEFAULT 'blue'::"public"."accent";
