-- Bricolage Grotesque becomes a selectable typeface.
--
-- Unlike 0003 this one is safe as drizzle-kit generated it: the new value is only added,
-- never used in the same transaction (the column default stays 'open-sans'), which is the
-- restriction Postgres actually enforces.

ALTER TYPE "public"."font_style" ADD VALUE 'bricolage-grotesque';
