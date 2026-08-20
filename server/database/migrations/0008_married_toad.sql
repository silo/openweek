-- better-auth 1.7 requires `issuer` on every account row and matches on it when it resolves
-- the credential account at sign-in. Hand-written rather than left as drizzle generated it:
-- the generated `ADD COLUMN ... NOT NULL` cannot apply to a database that already has
-- accounts in it, which is every install that is being upgraded rather than created.
--
-- The values are better-auth's own synthetic issuers (@better-auth/core, db/schema/account):
--   credential  -> `local:` + providerId
--   OAuth       -> `local:oauth:` + providerId
-- Existing rows are all one or the other, so add the column empty, fill it, then require it.
ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "account"
   SET "issuer" = CASE
     WHEN "provider_id" = 'credential' THEN 'local:credential'
     ELSE 'local:oauth:' || "provider_id"
   END
 WHERE "issuer" IS NULL;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;
