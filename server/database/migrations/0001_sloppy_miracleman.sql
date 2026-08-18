-- Paper / Ink design rework.
--
-- Four enums change their *values*, which Postgres cannot do in place. Each column is
-- parked on text, the type is recreated, and the column is cast back through a CASE that
-- maps old values to new ones. Without those CASE expressions a straight cast throws
-- ("invalid input value for enum") on any database that already holds rows, so this file
-- is hand-written rather than left as drizzle-kit generated it.
--
-- Value mapping:
--   theme            light -> paper, dark -> ink
--   font_style       all four old faces are gone -> open-sans (the new default)
--   tag_style        underline -> edge, swipe -> fill
--   highlight_color  butter -> amber, mint -> jade, sky -> indigo, rose -> magenta
--   accent_color     hex -> the nearest named ink

CREATE TYPE "public"."accent" AS ENUM('persimmon', 'amber', 'jade', 'indigo', 'magenta');--> statement-breakpoint
CREATE TYPE "public"."text_size" AS ENUM('small', 'default', 'large');--> statement-breakpoint

-- theme -----------------------------------------------------------------------
ALTER TABLE "user_settings" ALTER COLUMN "theme" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."theme";--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('paper', 'ink', 'system');--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DATA TYPE "public"."theme" USING (
  CASE "theme"
    WHEN 'light' THEN 'paper'
    WHEN 'dark' THEN 'ink'
    ELSE 'system'
  END
)::"public"."theme";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'system'::"public"."theme";--> statement-breakpoint

-- font_style ------------------------------------------------------------------
ALTER TABLE "user_settings" ALTER COLUMN "font_style" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "font_style" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."font_style";--> statement-breakpoint
CREATE TYPE "public"."font_style" AS ENUM('open-sans', 'lato', 'roboto', 'inter', 'source-sans-3');--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "font_style" SET DATA TYPE "public"."font_style" USING (
  'open-sans'
)::"public"."font_style";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "font_style" SET DEFAULT 'open-sans'::"public"."font_style";--> statement-breakpoint

-- tag_style -------------------------------------------------------------------
ALTER TABLE "user_settings" ALTER COLUMN "tag_style" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "tag_style" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."tag_style";--> statement-breakpoint
CREATE TYPE "public"."tag_style" AS ENUM('edge', 'fill');--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "tag_style" SET DATA TYPE "public"."tag_style" USING (
  CASE "tag_style"
    WHEN 'swipe' THEN 'fill'
    ELSE 'edge'
  END
)::"public"."tag_style";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "tag_style" SET DEFAULT 'edge'::"public"."tag_style";--> statement-breakpoint

-- accent_color: hex text -> named ink ------------------------------------------
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" SET DATA TYPE "public"."accent" USING (
  CASE upper("accent_color")
    WHEN '#CBDDE9' THEN 'indigo'
    WHEN '#EAD9A0' THEN 'amber'
    WHEN '#CFE0CB' THEN 'jade'
    WHEN '#E7CDD4' THEN 'magenta'
    ELSE 'persimmon'
  END
)::"public"."accent";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" SET DEFAULT 'persimmon'::"public"."accent";--> statement-breakpoint

-- highlight_color: nullable, so NULL must survive -------------------------------
ALTER TABLE "task" ALTER COLUMN "highlight_color" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."highlight_color";--> statement-breakpoint
CREATE TYPE "public"."highlight_color" AS ENUM('persimmon', 'amber', 'jade', 'indigo', 'magenta');--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "highlight_color" SET DATA TYPE "public"."highlight_color" USING (
  CASE "highlight_color"
    WHEN 'butter' THEN 'amber'
    WHEN 'mint' THEN 'jade'
    WHEN 'sky' THEN 'indigo'
    WHEN 'rose' THEN 'magenta'
    ELSE NULL
  END
)::"public"."highlight_color";--> statement-breakpoint

-- New appearance settings -------------------------------------------------------
ALTER TABLE "user_settings" ADD COLUMN "text_size" "public"."text_size" DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "show_weekends" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "collapse_done" boolean DEFAULT true NOT NULL;--> statement-breakpoint

-- Lists and calendars now store an ink name so they follow the active theme. Rows written
-- before the rework hold a literal colour; map the old palette across and leave anything
-- else alone (shared/constants/colors.ts renders unknown values as-is).
UPDATE "list" SET "color" = CASE upper("color")
  WHEN '#EAD9A0' THEN 'amber'
  WHEN '#D2E2CD' THEN 'jade'
  WHEN '#CFDEEA' THEN 'indigo'
  WHEN '#E9D2D8' THEN 'magenta'
  WHEN '#C6C1B5' THEN 'indigo'
  ELSE "color"
END;--> statement-breakpoint
UPDATE "calendar_source" SET "color" = CASE upper("color")
  WHEN '#86B08B' THEN 'jade'
  WHEN '#9CBBD6' THEN 'indigo'
  WHEN '#D3B488' THEN 'amber'
  ELSE "color"
END;--> statement-breakpoint
UPDATE "calendar_connection" SET "color" = CASE upper("color")
  WHEN '#86B08B' THEN 'jade'
  WHEN '#9CBBD6' THEN 'indigo'
  WHEN '#D3B488' THEN 'amber'
  ELSE "color"
END;
